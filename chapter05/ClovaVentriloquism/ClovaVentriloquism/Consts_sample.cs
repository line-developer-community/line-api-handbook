using System;
using System.Collections.Generic;
using System.Text;

namespace ClovaVentriloquism
{
    public static class Consts_sample
    {
        public static readonly string DurableEventNameLineVentriloquismInput = "LineVentriloquismInput";
        public static readonly string DurableEventNameAddToTemplate = "AddToTemplate";
        public static readonly string DurableEventNameEndTranslationMode = "EndTranslationMode";
        public static readonly string FinishMakingTemplate = "FinishMakingTemplate";

        public static readonly string SilentAudioFileUri = "https://example.com/xxx/xxx.mp3";

        public static readonly string LineMessagingApiChannelSecret = "xxxxxxxxxxxxx";
        public static readonly string LineMessagingApiAccessToken = "xxxxxxxxxxxxx";

        public static readonly string AzureCognitiveTranslatorEndpoint = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=";
        public static readonly string AzureCognitiveTranslatorKey = "xxxxxxxxxxxxx";
    }
}
