using Microsoft.AspNetCore.Authorization;

namespace BackendSource.PermissionSystem
{
    public class PermissionRequirement(string permission) : IAuthorizationRequirement
    {
        public string Permission { get; } = permission;
    }
}
