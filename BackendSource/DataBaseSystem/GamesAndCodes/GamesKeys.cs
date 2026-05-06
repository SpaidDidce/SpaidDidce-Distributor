using System.ComponentModel.DataAnnotations;

namespace BackendSource.DataBaseSystem.GamesAndCodes
{
    public class GamesKeys
    {
        [Key]
        public Guid KeyId { get; set; }
        public Guid GameId { get; set; }
    }
}
