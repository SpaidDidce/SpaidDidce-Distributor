using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendSource.Migrations
{
    /// <inheritdoc />
    public partial class AddStripeConnectToTeam : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "hashFromVersion",
                table: "GameVersions",
                newName: "FileHash");

            migrationBuilder.AddColumn<string>(
                name: "StripeAccountId",
                table: "teamTable",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "Games",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(float),
                oldType: "real");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StripeAccountId",
                table: "teamTable");

            migrationBuilder.RenameColumn(
                name: "FileHash",
                table: "GameVersions",
                newName: "hashFromVersion");

            migrationBuilder.AlterColumn<float>(
                name: "Price",
                table: "Games",
                type: "real",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");
        }
    }
}
