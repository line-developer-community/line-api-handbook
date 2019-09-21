// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Microsoft.BotBuilderSamples.Bots;
using Microsoft.Bot.Builder.EchoBot;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.BotBuilderSamples.Bots.Dialogs;
using Microsoft.BotBuilderSamples.Bots.Models;
using Microsoft.Bot.Builder.AI.Luis;

namespace Microsoft.BotBuilderSamples
{
    public class Startup
    {
        private const string BotOpenIdMetadataKey = "BotOpenIdMetadata";

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);

            // Create the Bot Framework Adapter.
            services.AddSingleton<IBotFrameworkHttpAdapter, AdapterWithErrorHandler>();

            // ユーザーと会話ステート保存用のストレージを作成。(メモリストレージはテスト用)
            services.AddSingleton<IStorage, MemoryStorage>();

            // 会話ステートの作成 (ダイアログ機能で利用)
            services.AddSingleton<ConversationState>();

            // 自然言語解析処理の追加
            var luisApplication = new LuisApplication(
                Configuration["LuisAppId"], 
                Configuration["LuisAPIKey"], 
                Configuration["LuisAPIHostUrl"]);
            services.AddSingleton<IRecognizer>(new LuisRecognizer(luisApplication));

            // Create the bot as a transient. In this case the ASP Controller is expecting an IBot.
            services.AddTransient<IBot, EchoBot>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseHsts();
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseMvc();
        }
    }
}
