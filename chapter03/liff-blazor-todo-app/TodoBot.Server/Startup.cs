using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;
using TodoBot.Server.Services;

[assembly: FunctionsStartup(typeof(TodoBot.Server.Startup))]
namespace TodoBot.Server
{
    public class Startup : FunctionsStartup
    {
        public override void Configure(IFunctionsHostBuilder builder)
        {
            //Using Cosmos DB
            //builder.Services.AddTransient<ITodoRepository>(provider => 
            //{
            //    var configuration = provider.GetRequiredService<IConfiguration>();
            //    var accountEndpoint = new Uri(configuration.GetValue<string>("Cosmos:AccountEndpoint"));
            //    var accountKey = configuration.GetValue<string>("Cosmos:AccountKey");
            //    return new CosmosDbTodoRepository(accountEndpoint, accountKey);
            //});

            //Using Azure Table Storage
            builder.Services.AddTransient<ITodoRepository>(provider => 
            {
                var configuration = provider.GetRequiredService<IConfiguration>();
                var connectionString = configuration.GetValue<string>("AzureWebJobsStorage");
                return new CloudTableRepository(connectionString);
            });

            builder.Services.AddSingleton<ILineTokenService>(provider =>
            {
                var configuration = provider.GetRequiredService<IConfiguration>();
                var clientId = configuration.GetValue<string>("LineClientId");
                return new LineTokenService(clientId);
            });
        }
    }
}
