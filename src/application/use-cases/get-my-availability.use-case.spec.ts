/**
 * UNIT TESTS FOR DefineAvailabilityUseCase
 *
 * TESTING STRATEGY:
 * We use MOCKS instead of a real database because:
 * 1. Unit tests must be ISOLATED - we only test the use case
 * 2. Tests must be FAST - no database connection
 * 3. Tests must be DETERMINISTIC - we control exactly what mocks return
 * 4. We follow Clean Architecture - use case depends on INTERFACES, not implementations
 *
 * PATTERN AAA (Arrange-Act-Assert):
 * - ARRANGE: Prepare data and configure mocks
 * - ACT: Execute the method under test
 * - ASSERT: Verify the result is as expected
 *
 * FOCUS:
 * - Output validation (availability slots count)
 * - Error cases (professional not found)
 */
