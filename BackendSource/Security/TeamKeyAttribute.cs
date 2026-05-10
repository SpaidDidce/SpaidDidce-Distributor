using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using BackendSource.DataBaseSystem;

namespace BackendSource.Security
{
    public class TeamKeyAttribute : Attribute, IFilterFactory
    {
        public string IdParameterName { get; set; } = "TeamId";
        public bool OnlyOwner { get; set; } = false;

        public bool IsReusable => false;

        public IFilterMetadata CreateInstance(IServiceProvider serviceProvider)
        {
            var dbContext = serviceProvider.GetRequiredService<DbContextBa>();
            return new TeamKeyFilter(dbContext, IdParameterName, OnlyOwner);
        }
    }
}
