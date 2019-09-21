using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.BotBuilderSamples.Bots.Dialogs;
using Microsoft.BotBuilderSamples.Bots.Models;
using Newtonsoft.Json.Linq;
using Remotion.Linq.Parsing.Structure.IntermediateModel;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples.Bots
{
    public class EchoBot : ActivityHandler
    {
        private ConversationState conversationState;
        private DialogSet dialogs;
        private IRecognizer recognizer;
        /// <summary>
        /// コンストラクタ―
        /// </summary>
        /// <param name="conversationState">会話ステート</param>
        public EchoBot(ConversationState conversationState, IRecognizer recognizer)
        {
            this.conversationState = conversationState;
            this.recognizer = recognizer;
            dialogs = new DialogSet(conversationState.CreateProperty<DialogState>("DialogState"));
            dialogs.Add(new UserProfileDialog());            
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            var recognizerResult = await recognizer.RecognizeAsync(turnContext, cancellationToken);
       
            var dialogContext = await dialogs.CreateContextAsync(turnContext, cancellationToken);

            if (recognizerResult.GetTopScoringIntent().score > 0.8)
            {
                if (recognizerResult.GetTopScoringIntent().intent == "cancel")
                {
                    await turnContext.SendActivityAsync("処理をキャンセルします");
                    await dialogContext.CancelAllDialogsAsync(cancellationToken);
                }
                else if (recognizerResult.GetTopScoringIntent().intent == "help")
                {
                    // ボタンテンプレートの作成
                    var button = new JObject
                    {
                        { "type", "template" },
                        { "altText", "ヘルプ" },
                        {
                            "template", new JObject
                            {
                                { "type", "buttons" },
                                { "text", "ヘルプ" },
                                { "actions", new JArray
                                    {
                                        new JObject
                                        {
                                            { "type", "uri" },
                                            { "label", "HPを開く" },
                                            { "uri", "https://developers.line.biz" }
                                        },
                                        new JObject
                                        {
                                            { "type", "message" },
                                            { "label", "プロファイルの登録" },
                                            { "text", "プロファイルの登録" }
                                        },
                                        new JObject
                                        {
                                            { "type", "message" },
                                            { "label", "キャンセル" },
                                            { "text", "キャンセル" }
                                        }
                                    }
                                }
                            }
                        }
                    };
                    var reply = (turnContext.Activity as Activity).CreateReply();
                    reply.ChannelData = button;
                    await turnContext.SendActivityAsync(reply);
                }
            }
            else
            {
                // まず ContinueDialogAsync を実行して既存のダイアログがあれば継続実行。
                var results = await dialogContext.ContinueDialogAsync(cancellationToken);

                // DialogTurnStatus が Empty の場合は既存のダイアログがないため、新規に実行
                if (results.Status == DialogTurnStatus.Empty)
                {
                    // ウォーターフォールダイアログを送信
                    await dialogContext.BeginDialogAsync(nameof(UserProfileDialog), new UserProfile(), cancellationToken);
                }
                // DialogTurnStatus が Complete の場合、ダイアログは完了したため結果を処理
                else if (results.Status == DialogTurnStatus.Complete)
                {
                    var userProfile = (UserProfile)results.Result;
                    var activities = new List<Activity>()
                    {
                        MessageFactory.Text($"ようこそ '{userProfile.Name}' さん！")
                    };

                    if (turnContext.Activity.ServiceUrl == "https://line.botframework.com/")
                    {
                        // スタンプオブジェクトの作成
                        var sticker = new JObject
                        {
                            { "type", "sticker" },
                            { "packageId", "11537" },
                            { "stickerId", "52002745" }
                        };
                        // 返信の作成とスタンプの設定
                        var reply = (turnContext.Activity as Activity).CreateReply();
                        reply.ChannelData = sticker;

                        activities.Add(reply);
                    }
                    await turnContext.SendActivitiesAsync(activities.ToArray(), cancellationToken);
                }
            }

            await conversationState.SaveChangesAsync(turnContext, false, cancellationToken);
        }

        protected override async Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, CancellationToken cancellationToken)
        {
            foreach (var member in membersAdded)
            {
                if (member.Id != turnContext.Activity.Recipient.Id)
                {
                    await turnContext.SendActivityAsync(MessageFactory.Text($"ようこそ"), cancellationToken);
                }
            }
        }
    }
}
