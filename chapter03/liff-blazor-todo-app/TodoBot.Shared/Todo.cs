using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using System;
using System.ComponentModel.DataAnnotations;

namespace TodoBot.Shared
{ 
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class Todo
    {
        public string Id { get; set; }

        public string UserId { get; set; }

        [Required(ErrorMessage ="タイトルを入力してください。")]
        public string Title { get; set; }

        public string Content { get; set; }

        public Status Status { get; set; }

        [JsonConverter(typeof(IsoDateTimeConverter))]
        public DateTime DueDate { get; set; }  

        public Todo()
        {

        }
        
    }
}