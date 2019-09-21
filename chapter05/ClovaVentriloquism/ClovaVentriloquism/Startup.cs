using LineDC.CEK;
using Line.Messaging;
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection;

[assembly: FunctionsStartup(typeof(ClovaVentriloquism.Startup))]
namespace ClovaVentriloquism
{
    public class Startup : FunctionsStartup
    {
        public override void Configure(IFunctionsHostBuilder builder)
        {
            builder.Services
                .AddClova<IDurableClova, VentriloquismClova>()
                .AddSingleton<ILineMessagingClient, LineMessagingClient>(_ => new LineMessagingClient(Consts.LineMessagingApiAccessToken));
        }
    }
}

