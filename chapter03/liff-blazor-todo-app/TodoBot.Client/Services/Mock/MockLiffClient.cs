using LineDC.Liff;
using LineDC.Liff.Data;
using Microsoft.JSInterop;
using System;
using System.Threading.Tasks;

namespace TodoBot.Client.Srvices
{
    public class MockLiffClient : ILiffClient
    {
        public bool Initialized { get; set; }

        public LiffData Data { get; private set; }

        public Profile Profile { get; private set; }

        public string AccessToken { get; private set; }
        
        public Task CloseWindowAsync()
        {
            throw new NotImplementedException();
        }

        public Task<string> GetAccessTokenAsync()
        {
            AccessToken = "dummy-access-token";
            return Task.FromResult(AccessToken);
        }

        public Task InitializeAsync(IJSRuntime jSRuntime)
        {
            Data = new LiffData
            {
                Context = new LiffContext()
                {
                    Type = ContextType.Utou,
                    UserId = "U28aa279ed6xxxxxxxxxxxxxxxxxxxxxx",
                    UtouId = "U28aa279ed6xxxxxxxxxxxxxxxxxxxxxx",
                    ViewType = ViewType.Tall
                },
                Language = "ja"
            };
            Initialized = true;
            return Task.CompletedTask;
        }

        public Task LoadProfileAsync()
        {
            Profile = new Profile
            {
                DisplayName = "pierre3",
                PictureUrl = "https://avatars1.githubusercontent.com/u/1255359?s=460&v=4",
                StatusMessage = "はろーわーるど！",
                UserId = "U28aa279ed6xxxxxxxxxxxxxxxxxxxxxxxx"
            };
            return Task.CompletedTask;
        }

        public Task OpenWindowAsync(string url, bool external)
        {
            throw new NotImplementedException();
        }

        public void Reset()
        {
            Initialized = false;
            Data = null;
            Profile = null;
        }

        public Task SendMessagesAsync(object messages)
        {
            throw new NotImplementedException();
        }
    }
}
