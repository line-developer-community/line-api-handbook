using Microsoft.Bot.Builder.Dialogs;
using System.Threading;
using System.Threading.Tasks;

namespace Microsoft.BotBuilderSamples.Bots.Validators
{
    public class NumberValidators
    {
        // int 型の入力に対して値を検証
        static public　async Task<bool> ValidateAge(PromptValidatorContext<int> promptcontext, CancellationToken cancellationtoken)
        {
            // 型が正しくない場合
            if (!promptcontext.Recognized.Succeeded)
            {
                return await Task.FromResult(false);
            }

            int age = promptcontext.Recognized.Value;
            if (age < 0 || age > 130)
            {
                return await Task.FromResult(false);
            }

            return await Task.FromResult(true);
        }
    }
}
