using LineDC.Liff;
using Microsoft.AspNetCore.Components.Builder;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http;
using TodoBot.Client.Srvices;

namespace TodoBot.Client
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton<ILiffClient, MockLiffClient>();
            services.AddSingleton<ITodoClient, MockTodoClient>();

            //services.AddSingleton<ILiffClient, LiffClient>();
            //services.AddSingleton<ITodoClient, TodoClient>(provider =>
            //    new TodoClient(provider.GetService<HttpClient>(), "https://myTodo.azurewebsites.net"));
        }

        public void Configure(IComponentsApplicationBuilder app)
        {
            app.AddComponent<App>("app");
        }
    }
}
