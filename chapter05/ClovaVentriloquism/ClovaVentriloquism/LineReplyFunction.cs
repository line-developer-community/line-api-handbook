using Line.Messaging;
using Line.Messaging.Webhooks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace ClovaVentriloquism
{
    public static class LineReplyFunction
    {
        private static readonly LineMessagingClient lineMessagingClient = new LineMessagingClient(Consts.LineMessagingApiAccessToken);

        [FunctionName(nameof(LineReplyFunction))]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)]HttpRequestMessage req,
            [DurableClient]IDurableOrchestrationClient client,
            ILogger log)
        {
            try
            {
                var ev = (await req.GetWebhookEventsAsync(Consts.LineMessagingApiChannelSecret)).FirstOrDefault();

                if (ev is MessageEvent messageEvent)
                {
                    await OnMessageEventAsync(client, messageEvent);
                }
                else if (ev is PostbackEvent postbackEvent)
                {
                    await OnPostbackEventAsync(client, postbackEvent);
                }
            }
            catch (Exception ex)
            {
                log.LogError(ex.Message);
                log.LogError(ex.StackTrace);
            }

            return new OkObjectResult("OK");
        }
        
        private static async Task OnMessageEventAsync(IDurableOrchestrationClient client, MessageEvent messageEvent)
        {
            if (messageEvent.Message is TextEventMessage message)
            {
                var str = message.Text.Replace("\r\n", "\n").Replace("\n", "。");

                // テンプレート入力中であればテンプレートにメッセージを追加
                var tmplStatus = await client.GetStatusAsync("tmpl_" + messageEvent.Source.UserId);
                if (tmplStatus?.RuntimeStatus == OrchestrationRuntimeStatus.ContinuedAsNew ||
                    tmplStatus?.RuntimeStatus == OrchestrationRuntimeStatus.Pending ||
                    tmplStatus?.RuntimeStatus == OrchestrationRuntimeStatus.Running)
                {
                    // Durable Functionsの外部イベントとして送信メッセージを投げる
                    await client.RaiseEventAsync("tmpl_" + messageEvent.Source.UserId, Consts.DurableEventNameAddToTemplate, str);

                    await lineMessagingClient.ReplyMessageAsync(messageEvent.ReplyToken,
                        new List<ISendMessage>
                        {
                            new TextMessage("テンプレートに追加しました。",
                                new QuickReply
                                {
                                    Items = { new QuickReplyButtonObject(new PostbackTemplateAction("作成を終了する", "action=endTemplateSetting")) }
                                })
                        });
                }
                else
                {
                    // 待機中になるまで待つ
                    while (true)
                    {
                        // ひとつ前のイベントを処理している最中は無視されるので注意
                        var ventStatus = await client.GetStatusAsync(messageEvent.Source.UserId);
                        if (ventStatus.RuntimeStatus == OrchestrationRuntimeStatus.ContinuedAsNew ||
                            ventStatus.RuntimeStatus == OrchestrationRuntimeStatus.Pending ||
                            ventStatus.RuntimeStatus == OrchestrationRuntimeStatus.Running)
                        {
                            // Durable Functionsの外部イベントとして送信メッセージを投げる
                            await client.RaiseEventAsync(messageEvent.Source.UserId, Consts.DurableEventNameLineVentriloquismInput, str);
                            break;
                        }
                        else if (ventStatus.RuntimeStatus == OrchestrationRuntimeStatus.Terminated ||
                                 ventStatus.RuntimeStatus == OrchestrationRuntimeStatus.Canceled ||
                                 ventStatus.RuntimeStatus == OrchestrationRuntimeStatus.Failed)
                        {
                            // キャンセル、失敗時はスキル起動していない状態のため、スキル起動を促す
                            await lineMessagingClient.ReplyMessageAsync(messageEvent.ReplyToken,
                                new List<ISendMessage>
                                {
                                    new TextMessage("Clovaで「テキスト腹話術」のスキルを起動してください。")
                                });
                            break;
                        }
                    }
                }
            }
        }

        private static async Task OnPostbackEventAsync(IDurableOrchestrationClient client, PostbackEvent postbackEvent)
        {
            switch (postbackEvent?.Postback?.Data)
            {
                // テンプレート作成開始
                case "action=startTemplateSetting":
                    await lineMessagingClient.ReplyMessageAsync(postbackEvent.ReplyToken,
                        new List<ISendMessage>
                        {
                            new TextMessage("テンプレートに追加したいセリフを送ってください。")
                        });

                    await client.StartNewAsync(nameof(MakeTemplate), "tmpl_" + postbackEvent.Source.UserId, null);
                    break;

                // テンプレート作成終了
                case "action=endTemplateSetting":
                    // Durable Functionsの外部イベントとして送信メッセージを投げる
                    await client.RaiseEventAsync("tmpl_" + postbackEvent.Source.UserId, Consts.DurableEventNameAddToTemplate, $"{Consts.FinishMakingTemplate}_{postbackEvent.ReplyToken}");
                    break;

                // 翻訳モード選択
                case "action=startTranslation":
                    // クイックリプライでモード選択
                    await lineMessagingClient.ReplyMessageAsync(postbackEvent.ReplyToken,
                        new List<ISendMessage>
                        {
                            new TextMessage("何語に翻訳しますか？",
                                new QuickReply
                                {
                                    Items =
                                    {
                                        new QuickReplyButtonObject(new PostbackTemplateAction(" 英語へ", "lang=en")),
                                        new QuickReplyButtonObject(new PostbackTemplateAction(" 韓国語へ", "lang=ko")),
                                        new QuickReplyButtonObject(new PostbackTemplateAction(" 日本語へ", "lang=ja")),
                                        new QuickReplyButtonObject(new PostbackTemplateAction(" 翻訳モード終了", "action=endTranslation"))
                                    }
                                })
                        });
                    break;

                // 翻訳モード開始
                case string s when s.StartsWith("lang="):
                    var lang = s.Replace("lang=", string.Empty);
                    await lineMessagingClient.ReplyMessageAsync(postbackEvent.ReplyToken,
                        new List<ISendMessage>
                        {
                            new TextMessage(
                                @$"{lang switch
                                {
                                    "en" => "英語",
                                    "ko" => "韓国語",
                                    "ja" => "日本語",
                                    _ => throw new InvalidOperationException()
                                }}に翻訳してしゃべります。")
                        });

                    await client.StartNewAsync(nameof(StartTranslationMode), "translation_" + postbackEvent.Source.UserId, lang);
                    break;

                // 翻訳モード終了
                case "action=endTranslation":
                    await lineMessagingClient.ReplyMessageAsync(postbackEvent.ReplyToken,
                        new List<ISendMessage> { new TextMessage("翻訳を終了します。") });
                    await client.RaiseEventAsync("translation_" + postbackEvent.Source.UserId, Consts.DurableEventNameEndTranslationMode);
                    break;

                // 無限セッション終了
                case "action=terminateDurableSession":
                    await lineMessagingClient.ReplyMessageAsync(postbackEvent.ReplyToken,
                        new List<ISendMessage> { new TextMessage("スキルを終了します。") });

                    // Durable Functionsの外部イベントとして送信メッセージを投げる
                    await client.TerminateAsync(postbackEvent.Source.UserId, "User Canceled");
                    await client.TerminateAsync("translation_" + postbackEvent.Source.UserId, "User Canceled");
                    break;
            }
        }

        /// <summary>
        /// LINEからのイベントを待機し、その入力内容をテンプレートに追加するオーケストレーター。
        /// </summary>
        /// <param name="context"></param>
        /// <returns></returns>
        [FunctionName(nameof(MakeTemplate))]
        public static async Task MakeTemplate(
            [OrchestrationTrigger] IDurableOrchestrationContext context)
        {
            var list = context.GetInput<List<string>>() ?? new List<string>();
            var value = await context.WaitForExternalEvent<string>(Consts.DurableEventNameAddToTemplate);

            if (value.StartsWith(Consts.FinishMakingTemplate))
            {
                // 完成したリストをReplyトークンとともに返信Activityに渡す
                var token = value.Replace(Consts.FinishMakingTemplate + "_", string.Empty);
                await context.CallActivityAsync(nameof(SendTemplates), (token, list));
            }
            else
            {
                // リストにセリフを追加しオーケストレーターを再実行
                list.Add(value);
                context.ContinueAsNew(list);
            }
        }

        [FunctionName(nameof(SendTemplates))]
        public static async Task SendTemplates(
            [ActivityTrigger] IDurableActivityContext context)
        {
            var input = context.GetInput<(string, List<string>)>();

            // テンプレート作成処理
            await lineMessagingClient.ReplyMessageAsync(input.Item1,
                new List<ISendMessage>
                {
                    FlexMessage.CreateBubbleMessage("セリフをタップしてね").SetBubbleContainer(
                        new BubbleContainer()
                            .SetHeader(BoxLayout.Horizontal)
                                .AddHeaderContents(new TextComponent
                                    {
                                        Text = "セリフをタップしてね",
                                        Margin = Spacing.Xs,
                                        Size = ComponentSize.Sm,
                                        Align = Align.Center,
                                        Gravity = Gravity.Bottom,
                                        Weight = Weight.Bold
                                    })
                            .SetFooter(new BoxComponent(BoxLayout.Vertical)
                            {
                                Spacing = Spacing.Md, Flex = 0,
                                Contents = input.Item2.Select(t => new ButtonComponent { Action = new MessageTemplateAction(t, t) }).ToList<IFlexComponent>()
                            }))
                });
        }

        [FunctionName(nameof(StartTranslationMode))]
        public static async Task StartTranslationMode(
            [OrchestrationTrigger] IDurableOrchestrationContext context)
        {
            context.SetCustomStatus(context.GetInput<string>());
            // 終了まで待機
            await context.WaitForExternalEvent(Consts.DurableEventNameEndTranslationMode);
        }
    }
}
