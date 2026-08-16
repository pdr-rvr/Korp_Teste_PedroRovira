using System.Net;
using System.Text.Json;
using BuildingBlocks.Common.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Common.Middlewares;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;
        int statusCode = (int)HttpStatusCode.InternalServerError;
        string title = "Erro Interno no Servidor";
        string detail = "Ocorreu um erro inesperado ao processar sua requisição.";
        IReadOnlyDictionary<string, string[]>? errors = null;

        if (exception is DomainException domainException)
        {
            statusCode = domainException.StatusCode;
            title = domainException.Title;
            detail = domainException.Message;
            errors = domainException.Errors;

            _logger.LogWarning(exception, "Exceção de domínio tratada [{StatusCode}]: {Message} (TraceId: {TraceId})", 
                statusCode, domainException.Message, traceId);
        }
        else
        {
            _logger.LogError(exception, "Exceção não tratada capturada pelo middleware (TraceId: {TraceId})", traceId);
            detail = !string.IsNullOrWhiteSpace(exception.Message) 
                ? exception.Message 
                : "Ocorreu um erro interno inesperado no servidor. O evento foi registrado para auditoria.";
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path,
            Extensions =
            {
                ["traceId"] = traceId,
                ["timestamp"] = DateTime.UtcNow
            }
        };

        if (errors != null)
        {
            problemDetails.Extensions["errors"] = errors;
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = statusCode;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, jsonOptions));
    }
}
