using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json.Converters;
namespace TodoBot.Shared
{
    [JsonConverter(typeof(StringEnumConverter), new object[] { true })]
    public enum Status
    {
        Ready,
        Doing,
        Done,
        Canceled
    }
}