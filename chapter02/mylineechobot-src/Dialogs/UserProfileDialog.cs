using Microsoft.AspNetCore.Authentication;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.BotBuilderSamples.Bots.Models;
using Microsoft.BotBuilderSamples.Bots.Validators;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples.Bots.Dialogs
{
    public class UserProfileDialog : ComponentDialog
    {
        public UserProfileDialog() : base(nameof(UserProfileDialog))
        {
            AddDialog(new TextPrompt(nameof(TextPrompt)));
            AddDialog(new NumberPrompt<int>(nameof(NumberPrompt<int>), NumberValidators.ValidateAge));
            AddDialog(new WaterfallDialog(nameof(WaterfallDialog), new WaterfallStep[]
            {
                AskNameAsync,
                AskAgeAsync,
                ConfirmAsync,
                FinalAsync
            }));

            // The initial child Dialog to run.
            InitialDialogId = nameof(WaterfallDialog);
        }

        private async Task<DialogTurnResult> AskNameAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {            
            // ユーザーに返信するプロンプトおよび内容の指定
            return await stepContext.PromptAsync(
                nameof(TextPrompt), 
                new PromptOptions
                {
                    Prompt = MessageFactory.Text("名前を教えてください。")
                }, 
                cancellationToken);
        }

        private async Task<DialogTurnResult> AskAgeAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var userProfile = (UserProfile)stepContext.Options;
            userProfile.Name = (string)stepContext.Result;
            return await stepContext.PromptAsync(
                nameof(NumberPrompt<int>),
                new PromptOptions
                {
                    Prompt = MessageFactory.Text("年齢を教えてください。"),
                    RetryPrompt = MessageFactory.Text("年齢を教えてください。(数字の 0 から 130 の間)")
                },
                cancellationToken);
        }

private async Task<DialogTurnResult> ConfirmAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
{
    var userProfile = (UserProfile)stepContext.Options;
    userProfile.Age = (int)stepContext.Result;

    var flex = $@"
{{  
  'type': 'flex',
  'altText': '確認メッセージ',
  'contents': {{
    'type': 'bubble',
    'body': {{
      'type': 'box',
      'layout': 'vertical',
      'spacing':'md',
      'contents': [
        {{
          'type': 'text',
          'text': '名前が{userProfile.Name}、年齢が {userProfile.Age} でよろしいですか？',
          'size': 'xs'
        }},
        {{
          'type': 'box',
          'layout': 'horizontal',
          'spacing': 'sm',
          'contents': [
            {{
            'type': 'button',
            'style': 'primary',
            'height':'sm',
            'action': {{
                'type': 'message',
                'label': 'はい',
                'text': 'はい'
            }}
            }},
            {{
              'type': 'button',
              'style': 'primary',
              'height':'sm',
              'action': {{
                'type': 'message',
                'label': 'いいえ',
                'text': 'いいえ'
              }}
            }}
          ]
        }}
      ]
    }}         
  }}
}}";

    var prompt = stepContext.Context.Activity.CreateReply();
    prompt.ChannelData = JObject.Parse(flex);
    return await stepContext.PromptAsync(
        nameof(TextPrompt),
        new PromptOptions
        {
            Prompt = prompt
        },
        cancellationToken);
}

        private async Task<DialogTurnResult> FinalAsync(WaterfallStepContext stepContext, CancellationToken cancellationToken)
        {
            var confirmed = stepContext.Result.ToString();
            if(confirmed == "はい")
            {
                // stepContext.Options (UserProfile) を結果として返す
                return await stepContext.EndDialogAsync(stepContext.Options);
            }
            else
            {
                // ReplaceDialogAsync でダイアログをやり直す
                return await stepContext.ReplaceDialogAsync(nameof(UserProfileDialog), stepContext.Options, cancellationToken);
            }          
        }
    }
}
