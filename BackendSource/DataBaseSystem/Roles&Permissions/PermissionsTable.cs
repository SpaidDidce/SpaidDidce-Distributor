using System.ComponentModel.DataAnnotations;

namespace BackendSource.DataBaseSystem.Roles_Permissions
{
    public class PermissionsTable
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public ICollection<RolePermissionTable> RolePermissions { get; set; }
            = new List<RolePermissionTable>();
    }
}
