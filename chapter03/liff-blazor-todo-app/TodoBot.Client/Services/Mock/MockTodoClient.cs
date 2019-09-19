using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using TodoBot.Shared;

namespace TodoBot.Client.Srvices
{
    public class MockTodoClient : ITodoClient
    {
        private IList<Todo> todoList = new List<Todo>
        {
            new Todo()
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "U28aa279ed6xxxxxxxxxxxxxxxxxxxxxx",
                Title ="ゴミ出し",
                Content ="段ボール・紙類をまとめる",
                Status = Status.Ready,
                DueDate = DateTime.Now + TimeSpan.FromDays(1)
            },
            new Todo()
            {
                Id = Guid.NewGuid().ToString(),
                UserId = "U28aa279ed6xxxxxxxxxxxxxxxxxxxxxx",
                Title ="日用品の買い出し",
                Content ="トイレットペーパー、洗濯洗剤、歯磨き粉",
                Status = Status.Ready,
                DueDate = DateTime.Now + TimeSpan.FromDays(1)
            },
        };
        

        public Task<IList<Todo>> GetTodoListAsync(string accessToken, string userId)
        {
            return Task.FromResult(todoList);
        }

        public Task<Todo> GetTodoAsync(string accessToken, string userId, string id)
        {
            return Task.FromResult(todoList.FirstOrDefault(x => x.UserId == userId && x.Id == id));
        }

        public async Task UpdateTodoAsync(string accessToken, string id, Todo todo)
        {
            var target = await GetTodoAsync(accessToken, todo.UserId, id);
            target.Title = todo.Title;
            target.Content = todo.Content;
            target.Status = todo.Status;
            target.DueDate = todo.DueDate;
        }

        public Task CreateTodoAsync(string accessToken, Todo todo)
        {
            todo.Id = Guid.NewGuid().ToString();
            todoList.Add(todo);
            return Task.CompletedTask;
        }

        public async Task DeleteTodoAsync(string accessToken, string userId, string id)
        {
            todoList.Remove(await GetTodoAsync(accessToken, userId, id));
        }

    }
}
