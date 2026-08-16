using BuildingBlocks.Common.Idempotency;
using BuildingBlocks.Common.Models;
using BillingService.Domain;
using BillingService.DTOs;
using BillingService.Services;
using Microsoft.AspNetCore.Mvc;

namespace BillingService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly IAiAuditorService _aiAuditorService;
    private readonly ILogger<InvoicesController> _logger;

    public InvoicesController(IInvoiceService invoiceService, IAiAuditorService aiAuditorService, ILogger<InvoicesController> logger)
    {
        _invoiceService = invoiceService;
        _aiAuditorService = aiAuditorService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] InvoiceStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var result = await _invoiceService.GetAllAsync(status, search, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var invoice = await _invoiceService.GetByIdAsync(id, cancellationToken);
        return Ok(invoice);
    }

    [HttpPost]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto, CancellationToken cancellationToken = default)
    {
        var created = await _invoiceService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPost("{id:guid}/issue")]
    [Idempotent(ttlSeconds: 60)] // Idempotência garantida contra múltiplos cliques acidentais
    [ProducesResponseType(typeof(IssueInvoiceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> IssueInvoice(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _invoiceService.IssueInvoiceAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpGet("ai-audit")]
    [ProducesResponseType(typeof(AiAuditReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAiAudit(CancellationToken cancellationToken = default)
    {
        var report = await _aiAuditorService.GenerateAuditReportAsync(cancellationToken);
        return Ok(report);
    }
}
