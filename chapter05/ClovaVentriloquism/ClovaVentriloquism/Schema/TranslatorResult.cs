using Newtonsoft.Json;
using System.Collections.Generic;

namespace ClovaVentriloquism.Schema
{

    public class TranslatorResult
    {
        [JsonProperty("detectedLanguage")]
        public Detectedlanguage DetectedLanguage { get; set; }
        [JsonProperty("translations")]
        public List<Translation> Translations { get; set; }
    }

    public class Detectedlanguage
    {
        [JsonProperty("language")]
        public string Language { get; set; }
        [JsonProperty("score")]
        public float Score { get; set; }
    }

    public class Translation
    {
        [JsonProperty("text")]
        public string Text { get; set; }
        [JsonProperty("to")]
        public string To { get; set; }
    }
}
