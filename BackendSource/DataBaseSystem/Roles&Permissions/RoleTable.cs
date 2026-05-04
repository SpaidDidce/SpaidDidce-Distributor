using BackendSource.DataBaseSystem.Roles_Permissions;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendSource.DataBaseSystem
{
    [Table("Roles")]
    public class RoleTable
    {
        [Key]
        public Guid Id { get; set;}

        [Required]
        public string RoleName { get; set;} = string.Empty;

        public ICollection<RolePermissionTable> RolePermissions { get; set; } = new List<RolePermissionTable>();
    }
}
