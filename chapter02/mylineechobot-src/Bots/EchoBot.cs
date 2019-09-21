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
        /// �R���X�g���N�^�\
        /// </summary>
        /// <param name="conversationState">��b�X�e�[�g</param>
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
                    await turnContext.SendActivityAsync("�������L�����Z�����܂�");
                    await dialogContext.CancelAllDialogsAsync(cancellationToken);
                }
                else if (recognizerResult.GetTopScoringIntent().intent == "help")
                {
                    // �{�^���e���v���[�g�̍쐬
                    var button = new JObject
                    {
                        { "type", "template" },
                        { "altText", "�w���v" },
                        {
                            "template", new JObject
                            {
                                { "type", "buttons" },
                                { "text", "�w���v" },
                                { "actions", new JArray
                                    {
                                        new JObject
                                        {
                                            { "type", "uri" },
                                            { "label", "HP���J��" },
                                            { "uri", "https://developers.line.biz" }
                                        },
                                        new JObject
                                        {
                                            { "type", "message" },
                                            { "label", "�v���t�@�C���̓o�^" },
                                            { "text", "�v���t�@�C���̓o�^" }
                                        },
                                        new JObject
                                        {
                                            { "type", "message" },
                                            { "label", "�L�����Z��" },
                                            { "text", "�L�����Z��" }
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
                // �܂� ContinueDialogAsync �����s���Ċ����̃_�C�A���O������Όp�����s�B
                var results = await dialogContext.ContinueDialogAsync(cancellationToken);

                // DialogTurnStatus �� Empty �̏ꍇ�͊����̃_�C�A���O���Ȃ����߁A�V�K�Ɏ��s
                if (results.Status == DialogTurnStatus.Empty)
                {
                    // �E�H�[�^�[�t�H�[���_�C�A���O�𑗐M
                    await dialogContext.BeginDialogAsync(nameof(UserProfileDialog), new UserProfile(), cancellationToken);
                }
                // DialogTurnStatus �� Complete �̏ꍇ�A�_�C�A���O�͊����������ߌ��ʂ�����
                else if (results.Status == DialogTurnStatus.Complete)
                {
                    var userProfile = (UserProfile)results.Result;
                    var activities = new List<Activity>()
                    {
                        MessageFactory.Text($"�悤���� '{userProfile.Name}' ����I")
                    };

                    if (turnContext.Activity.ServiceUrl == "https://line.botframework.com/")
                    {
                        // �X�^���v�I�u�W�F�N�g�̍쐬
                        var sticker = new JObject
                        {
                            { "type", "sticker" },
                            { "packageId", "11537" },
                            { "stickerId", "52002745" }
                        };
                        // �ԐM�̍쐬�ƃX�^���v�̐ݒ�
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
                    await turnContext.SendActivityAsync(MessageFactory.Text($"�悤����"), cancellationToken);
                }
            }
        }
    }
}
