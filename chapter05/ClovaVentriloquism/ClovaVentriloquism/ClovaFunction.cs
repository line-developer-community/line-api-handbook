using DurableTask.Core;
using Line.Messaging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ClovaVentriloquism
{
    public class ClovaFunction
    {
        private readonly IDurableClova _clova;

        public ClovaFunction(IDurableClova clova, ILineMessagingClient lineMessagingClient)
        {
            _clova = clova;
            _clova.LineMessagingClient = lineMessagingClient;
        }

        /// <summary>
        /// CEKのエンドポイント。
        /// </summary>
        /// <param name="req"></param>
        /// <param name="client"></param>
        /// <param name="context"></param>
        /// <param name="log"></param>
        /// <returns></returns>
        [FunctionName(nameof(CEKEndpoint))]
        public async Task<IActionResult> CEKEndpoint(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)]HttpRequest req,
            [DurableClient] IDurableOrchestrationClient client,
            ExecutionContext context,
            ILogger log)
        {
            _clova.DurableOrchestrationClient = client;
            _clova.Logger = log;

            var response = await _clova.RespondAsync(req.Headers["SignatureCEK"], req.Body);
            return new OkObjectResult(response);
        }

        

        /// <summary>
        /// LINEからのイベントを待機し、その入力内容を返すオーケストレーター。
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        [FunctionName(nameof(WaitForLineInput))]
        public async Task<string> WaitForLineInput(
            [OrchestrationTrigger] IDurableOrchestrationContext context,
            ILogger log)
        {
            return await context.WaitForExternalEvent<string>(Consts.DurableEventNameLineVentriloquismInput);
        }

        /// <summary>
        /// 実行履歴を削除するタイマー関数。1日1回、午前12時に実行されます。
        /// </summary>
        /// <param name="client"></param>
        /// <param name="myTimer"></param>
        /// <returns></returns>
        [FunctionName(nameof(HistoryCleanerFunction))]
        public Task HistoryCleanerFunction(
            [DurableClient] IDurableOrchestrationClient client,
            [TimerTrigger("0 0 12 * * *")]TimerInfo myTimer)
        {
            return client.PurgeInstanceHistoryAsync(
                DateTime.MinValue,
                DateTime.UtcNow.AddDays(-1),
                new List<OrchestrationStatus>
                {
                    OrchestrationStatus.Completed
                });
        }
    }
}