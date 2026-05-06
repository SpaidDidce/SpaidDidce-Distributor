using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendSource.DataBaseSystem
{
    [Table("LicencesTable")]
    public class LicencesTable
    {
        [Key]
        public Guid LicenceId { get; set; }
        public Guid GameId { get; set; }
        public Guid PlayerId { get; set; }
    }
}
