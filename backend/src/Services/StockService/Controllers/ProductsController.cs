using BuildingBlocks.Common.Models;
using Microsoft.AspNetCore.Mvc;
using StockService.DTOs;
using StockService.Services;

namespace StockService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly FaultSimulatorState _faultState;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(IProductService productService, FaultSimulatorState faultState, ILogger<ProductsController> logger)
    {
        _productService = productService;
        _faultState = faultState;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
    {
        CheckFaultSimulation();
        var result = await _productService.GetAllAsync(search, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        CheckFaultSimulation();
        var product = await _productService.GetByIdAsync(id, cancellationToken);
        return Ok(product);
    }

    [HttpGet("by-code/{code}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken = default)
    {
        CheckFaultSimulation();
        var product = await _productService.GetByCodeAsync(code, cancellationToken);
        return Ok(product);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto, CancellationToken cancellationToken = default)
    {
        CheckFaultSimulation();
        var created = await _productService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductDto dto, CancellationToken cancellationToken = default)
    {
        CheckFaultSimulation();
        var updated = await _productService.UpdateAsync(id, dto, cancellationToken);
        return Ok(updated);
    }

    [HttpPost("deduct")]
    [ProducesResponseType(typeof(DeductStockResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeductStock([FromBody] DeductStockRequestDto request, CancellationToken cancellationToken = default)
    {
        CheckFaultSimulation();
        var result = await _productService.DeductStockAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("fault-toggle")]
    public IActionResult ToggleFault([FromBody] ToggleFaultRequest? request)
    {
        if (request?.Enable == true)
        {
            _faultState.EnableFault(request.StatusCode > 0 ? request.StatusCode : 503, request.Message);
            _logger.LogWarning("Simulador de falhas do StockService ATIVADO (Status: {StatusCode})", _faultState.FaultStatusCode);
            return Ok(new { IsFaultActive = true, Message = "Simulação de falha ativada com sucesso." });
        }

        _faultState.DisableFault();
        _logger.LogInformation("Simulador de falhas do StockService DESATIVADO.");
        return Ok(new { IsFaultActive = false, Message = "Simulação de falha desativada com sucesso." });
    }

    [HttpGet("fault-status")]
    public IActionResult GetFaultStatus()
    {
        return Ok(new
        {
            IsFaultActive = _faultState.IsFaultSimulated,
            StatusCode = _faultState.FaultStatusCode,
            Message = _faultState.FaultMessage
        });
    }

    [HttpPost("reset-seed")]
    public async Task<IActionResult> ResetSeed([FromServices] Infrastructure.StockDbContext context)
    {
        await Infrastructure.DbInitializer.ResetAndSeedAsync(context);
        return Ok(new { Success = true, Message = "Banco de dados de Estoque limpo e repovoado com dataset corporativo com sucesso." });
    }

    private void CheckFaultSimulation()
    {
        if (_faultState.IsFaultSimulated)
        {
            throw new HttpRequestException(_faultState.FaultMessage, null, (System.Net.HttpStatusCode)_faultState.FaultStatusCode);
        }
    }
}

public record ToggleFaultRequest(bool Enable, int StatusCode = 503, string? Message = null);
