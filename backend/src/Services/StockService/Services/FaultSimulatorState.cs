namespace StockService.Services;

public class FaultSimulatorState
{
    private bool _isFaultSimulated = false;
    private int _faultStatusCode = 503;
    private string _faultMessage = "Falha simulada no serviço de estoque (StockService).";

    public bool IsFaultSimulated => _isFaultSimulated;
    public int FaultStatusCode => _faultStatusCode;
    public string FaultMessage => _faultMessage;

    public void EnableFault(int statusCode = 503, string? message = null)
    {
        _isFaultSimulated = true;
        _faultStatusCode = statusCode;
        if (!string.IsNullOrWhiteSpace(message)) _faultMessage = message;
    }

    public void DisableFault()
    {
        _isFaultSimulated = false;
    }
}
