using Line.Messaging;
using LineDC.CEK;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;

namespace ClovaVentriloquism
{
    public interface IDurableClova : IClova
    {
        ILogger Logger { get; set; }
        IDurableOrchestrationClient DurableOrchestrationClient { get; set; }
        ILineMessagingClient LineMessagingClient { get; set; }
    }
}
