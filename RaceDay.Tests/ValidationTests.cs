using System.ComponentModel.DataAnnotations;
using RaceDay.Api.DTOs;
using Xunit;

namespace RaceDay.Tests;

public class ValidationTests
{
    [Fact]
    public void RegisterRejectsInvalidEmail()
    {
        var request = new RegisterRequest("Thato", "Example", "bad-email", "Password123!");
        Assert.False(IsValid(request));
    }

    [Fact]
    public void RegisterRejectsShortPassword()
    {
        var request = new RegisterRequest("Thato", "Example", "t@example.com", "short");
        Assert.False(IsValid(request));
    }

    [Fact]
    public void RegisterAcceptsValidData()
    {
        var request = new RegisterRequest("Thato", "Example", "t@example.com", "Password123!");
        Assert.True(IsValid(request));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void EventRejectsNonPositiveDistance(decimal distance)
    {
        var request = new EventRequest(
            "Community Run", null, new DateOnly(2027, 1, 1),
            "Nelspruit", "Mpumalanga", "Run", "Race", null, distance, null, null, "Open");

        Assert.False(IsValid(request));
    }

    [Fact]
    public void EventAcceptsPositiveDistance()
    {
        var request = new EventRequest(
            "Community Run", "Test event", new DateOnly(2027, 1, 1),
            "Nelspruit", "Mpumalanga", "Run", "Race", null, 10m, null, null, "Open");

        Assert.True(IsValid(request));
    }

    [Fact]
    public void LoginRejectsInvalidEmail()
    {
        var request = new LoginRequest("not-an-email", "Password123!");
        Assert.False(IsValid(request));
    }

    private static bool IsValid(object value) =>
        Validator.TryValidateObject(
            value,
            new ValidationContext(value),
            new List<ValidationResult>(),
            validateAllProperties: true);
}
