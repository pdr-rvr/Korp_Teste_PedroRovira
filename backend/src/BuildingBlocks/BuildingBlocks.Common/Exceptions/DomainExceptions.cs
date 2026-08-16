namespace BuildingBlocks.Common.Exceptions;

public abstract class DomainException : Exception
{
    public int StatusCode { get; }
    public string Title { get; }
    public IReadOnlyDictionary<string, string[]>? Errors { get; }

    protected DomainException(string message, string title = "Erro de Domínio", int statusCode = 400, IReadOnlyDictionary<string, string[]>? errors = null)
        : base(message)
    {
        Title = title;
        StatusCode = statusCode;
        Errors = errors;
    }
}

public class NotFoundException : DomainException
{
    public NotFoundException(string resourceName, object key)
        : base($"{resourceName} com identificador '{key}' não foi encontrado(a).", "Recurso Não Encontrado", 404)
    {
    }

    public NotFoundException(string message)
        : base(message, "Recurso Não Encontrado", 404)
    {
    }
}

public class ConflictException : DomainException
{
    public ConflictException(string message)
        : base(message, "Conflito de Concorrência ou Regra de Negócio", 409)
    {
    }
}

public class BusinessRuleException : DomainException
{
    public BusinessRuleException(string message)
        : base(message, "Regra de Negócio Violada", 400)
    {
    }
}

public class ValidationException : DomainException
{
    public ValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base("Um ou mais erros de validação ocorreram.", "Erro de Validação", 400, errors)
    {
    }

    public ValidationException(string propertyName, string errorMessage)
        : base("Um ou mais erros de validação ocorreram.", "Erro de Validação", 400, new Dictionary<string, string[]> { { propertyName, new[] { errorMessage } } })
    {
    }
}
