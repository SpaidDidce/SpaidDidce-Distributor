using System.ComponentModel.DataAnnotations.Schema;
using System.Security.Permissions;

namespace BackendSource.DataBaseSystem.Roles_Permissions
{
    [Table("RolePermissionTable")]
    public class RolePermissionTable
    {
        public Guid Id { get; set; }
        public Guid RoleId { get; set; }
        public RoleTable Role { get; set; } = default!;

        public Guid PermissionId { get; set; }
        public PermissionsTable Permission { get; set; } = default!;
    }
}
