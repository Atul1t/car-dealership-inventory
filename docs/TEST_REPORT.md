# Test Report

Generated on 25 October 2026 from the commands below. Re-run them to regenerate.

| Suite | Tool | Tests | Result | Coverage |
|---|---|---|---|---|
| Backend (FastAPI) against **PostgreSQL 16** | pytest + pytest-cov | 105 | ✅ 105 passed in 7.43s | **99%** lines |
| Frontend (React) | Vitest + Testing Library | 64 | ✅ 64 passed | **96.82%** statements |

The backend suite also passes against SQLite (the default when `TEST_DATABASE_URL` isn't set).
`tests/test_api_contract.py` checks that the API exposes exactly the endpoints listed in the requirements.

## Backend

```bash
cd backend
TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/dealership_test \
  pytest -v --cov --cov-report=term-missing
```

### Coverage

```text
Name                                     Stmts   Miss  Cover   Missing
----------------------------------------------------------------------
app/__init__.py                              0      0   100%
app/api/__init__.py                          0      0   100%
app/api/deps.py                             28      0   100%
app/api/errors.py                           10      0   100%
app/api/routes/__init__.py                   0      0   100%
app/api/routes/auth.py                      15      0   100%
app/api/routes/vehicles.py                  28      0   100%
app/core/__init__.py                         0      0   100%
app/core/config.py                          19      0   100%
app/core/security.py                        25      0   100%
app/db/__init__.py                           0      0   100%
app/db/base.py                               3      0   100%
app/db/session.py                           11      4    64%   16-20
app/main.py                                 14      0   100%
app/models/__init__.py                       3      0   100%
app/models/user.py                          19      0   100%
app/models/vehicle.py                       16      0   100%
app/repositories/__init__.py                 0      0   100%
app/repositories/user_repository.py         16      0   100%
app/repositories/vehicle_repository.py      50      0   100%
app/schemas/__init__.py                      0      0   100%
app/schemas/auth.py                         32      0   100%
app/schemas/vehicle.py                      52      0   100%
app/scripts/__init__.py                      0      0   100%
app/scripts/seed.py                         20      0   100%
app/services/__init__.py                     0      0   100%
app/services/auth_service.py                28      0   100%
app/services/exceptions.py                   9      0   100%
app/services/vehicle_service.py             34      0   100%
----------------------------------------------------------------------
TOTAL                                      432      4    99%
```

The 4 uncovered lines are `get_db()` in `app/db/session.py`; the tests swap it for a test-database session.

<details>
<summary>Full pytest output</summary>

```text
============================= test session starts ==============================
platform linux -- Python 3.13.17, pytest-9.1.1, pluggy-1.7.0 -- /usr/local/bin/python
rootdir: backend
configfile: pyproject.toml
testpaths: tests
plugins: platformdirs-4.12.4, anyio-4.15.1, cov-7.1.0
collecting ... collected 105 items

tests/test_api_contract.py::test_exposes_exactly_the_required_endpoints PASSED [  0%]
tests/test_auth.py::TestRegister::test_registers_a_new_user_as_regular_customer PASSED [  1%]
tests/test_auth.py::TestRegister::test_never_returns_the_password_or_its_hash PASSED [  2%]
tests/test_auth.py::TestRegister::test_cannot_self_register_as_admin PASSED [  3%]
tests/test_auth.py::TestRegister::test_rejects_duplicate_email PASSED    [  4%]
tests/test_auth.py::TestRegister::test_duplicate_check_is_case_insensitive PASSED [  5%]
tests/test_auth.py::TestRegister::test_rejects_invalid_email PASSED      [  6%]
tests/test_auth.py::TestRegister::test_rejects_short_password PASSED     [  7%]
tests/test_auth.py::TestRegister::test_rejects_blank_name PASSED         [  8%]
tests/test_auth.py::TestLogin::test_returns_bearer_token_and_user_for_valid_credentials PASSED [  9%]
tests/test_auth.py::TestLogin::test_email_is_case_insensitive PASSED     [ 10%]
tests/test_auth.py::TestLogin::test_rejects_wrong_password PASSED        [ 11%]
tests/test_auth.py::TestLogin::test_rejects_unknown_email_with_same_message PASSED [ 12%]
tests/test_auth.py::TestTokenUsage::test_login_token_unlocks_protected_endpoints PASSED [ 13%]
tests/test_auth.py::TestPasswordLimits::test_rejects_password_longer_than_bcrypt_limit PASSED [ 14%]
tests/test_auth.py::TestPasswordLimits::test_byte_limit_counts_multibyte_characters PASSED [ 15%]
tests/test_auth.py::TestPasswordLimits::test_login_with_overlong_password_is_a_normal_401 PASSED [ 16%]
tests/test_inventory.py::TestPurchase::test_purchase_decreases_quantity_by_one_by_default PASSED [ 17%]
tests/test_inventory.py::TestPurchase::test_can_purchase_several_units PASSED [ 18%]
tests/test_inventory.py::TestPurchase::test_can_buy_the_last_unit PASSED [ 19%]
tests/test_inventory.py::TestPurchase::test_out_of_stock_vehicle_cannot_be_purchased PASSED [ 20%]
tests/test_inventory.py::TestPurchase::test_cannot_buy_more_than_available_and_stock_is_unchanged PASSED [ 20%]
tests/test_inventory.py::TestPurchase::test_admins_can_purchase_too PASSED [ 21%]
tests/test_inventory.py::TestPurchase::test_quantity_must_be_positive[0] PASSED [ 22%]
tests/test_inventory.py::TestPurchase::test_quantity_must_be_positive[-1] PASSED [ 23%]
tests/test_inventory.py::TestPurchase::test_unknown_vehicle_is_404 PASSED [ 24%]
tests/test_inventory.py::TestPurchase::test_requires_authentication PASSED [ 25%]
tests/test_inventory.py::TestRestock::test_admin_restock_increases_quantity PASSED [ 26%]
tests/test_inventory.py::TestRestock::test_restocking_a_sold_out_vehicle_makes_it_purchasable PASSED [ 27%]
tests/test_inventory.py::TestRestock::test_regular_user_cannot_restock PASSED [ 28%]
tests/test_inventory.py::TestRestock::test_quantity_is_required_and_positive[payload0] PASSED [ 29%]
tests/test_inventory.py::TestRestock::test_quantity_is_required_and_positive[payload1] PASSED [ 30%]
tests/test_inventory.py::TestRestock::test_quantity_is_required_and_positive[payload2] PASSED [ 31%]
tests/test_inventory.py::TestRestock::test_unknown_vehicle_is_404 PASSED [ 32%]
tests/test_inventory.py::TestRestock::test_requires_authentication PASSED [ 33%]
tests/test_seed.py::test_creates_an_admin_and_sample_vehicles PASSED     [ 34%]
tests/test_seed.py::test_is_idempotent PASSED                            [ 35%]
tests/test_seed.py::test_does_not_add_samples_to_a_non_empty_inventory PASSED [ 36%]
tests/test_seed.py::test_promotes_an_existing_account_with_the_admin_email PASSED [ 37%]
tests/test_vehicle_search.py::TestSearchVehicles::test_by_make_is_partial_and_case_insensitive PASSED [ 38%]
tests/test_vehicle_search.py::TestSearchVehicles::test_by_model PASSED   [ 39%]
tests/test_vehicle_search.py::TestSearchVehicles::test_by_category_is_case_insensitive PASSED [ 40%]
tests/test_vehicle_search.py::TestSearchVehicles::test_by_category_matches_whole_category_only PASSED [ 40%]
tests/test_vehicle_search.py::TestSearchVehicles::test_by_minimum_price_is_inclusive PASSED [ 41%]
tests/test_vehicle_search.py::TestSearchVehicles::test_by_maximum_price_is_inclusive PASSED [ 42%]
tests/test_vehicle_search.py::TestSearchVehicles::test_by_price_range PASSED [ 43%]
tests/test_vehicle_search.py::TestSearchVehicles::test_filters_combine_with_and PASSED [ 44%]
tests/test_vehicle_search.py::TestSearchVehicles::test_no_filters_returns_everything PASSED [ 45%]
tests/test_vehicle_search.py::TestSearchVehicles::test_no_matches_returns_empty_list PASSED [ 46%]
tests/test_vehicle_search.py::TestSearchVehicles::test_blank_text_filters_are_ignored PASSED [ 47%]
tests/test_vehicle_search.py::TestSearchVehicles::test_min_price_above_max_price_is_rejected PASSED [ 48%]
tests/test_vehicle_search.py::TestSearchVehicles::test_negative_price_is_rejected PASSED [ 49%]
tests/test_vehicle_search.py::TestSearchVehicles::test_requires_authentication PASSED [ 50%]
tests/test_vehicle_search.py::TestSearchWildcards::test_sql_wildcards_are_treated_literally[%] PASSED [ 51%]
tests/test_vehicle_search.py::TestSearchWildcards::test_sql_wildcards_are_treated_literally[_] PASSED [ 52%]
tests/test_vehicle_search.py::TestSearchWildcards::test_sql_wildcards_are_treated_literally[Hon%a] PASSED [ 53%]
tests/test_vehicle_search.py::TestSearchWildcards::test_literal_special_characters_still_match PASSED [ 54%]
tests/test_vehicle_update_delete.py::TestUpdateVehicle::test_updates_details PASSED [ 55%]
tests/test_vehicle_update_delete.py::TestUpdateVehicle::test_update_is_persisted PASSED [ 56%]
tests/test_vehicle_update_delete.py::TestUpdateVehicle::test_any_logged_in_user_can_update PASSED [ 57%]
tests/test_vehicle_update_delete.py::TestUpdateVehicle::test_unknown_vehicle_is_404 PASSED [ 58%]
tests/test_vehicle_update_delete.py::TestUpdateVehicle::test_rejects_invalid_values PASSED [ 59%]
tests/test_vehicle_update_delete.py::TestUpdateVehicle::test_explicit_null_is_rejected PASSED [ 60%]
tests/test_vehicle_update_delete.py::TestUpdateVehicle::test_requires_authentication PASSED [ 60%]
tests/test_vehicle_update_delete.py::TestDeleteVehicle::test_admin_can_delete PASSED [ 61%]
tests/test_vehicle_update_delete.py::TestDeleteVehicle::test_regular_user_cannot_delete PASSED [ 62%]
tests/test_vehicle_update_delete.py::TestDeleteVehicle::test_unknown_vehicle_is_404 PASSED [ 63%]
tests/test_vehicle_update_delete.py::TestDeleteVehicle::test_requires_authentication PASSED [ 64%]
tests/test_vehicles.py::TestCreateVehicle::test_adds_a_vehicle PASSED    [ 65%]
tests/test_vehicles.py::TestCreateVehicle::test_each_vehicle_gets_a_unique_id PASSED [ 66%]
tests/test_vehicles.py::TestCreateVehicle::test_quantity_defaults_to_zero PASSED [ 67%]
tests/test_vehicles.py::TestCreateVehicle::test_text_fields_are_trimmed PASSED [ 68%]
tests/test_vehicles.py::TestCreateVehicle::test_any_logged_in_user_can_add_a_vehicle PASSED [ 69%]
tests/test_vehicles.py::TestCreateVehicle::test_requires_authentication PASSED [ 70%]
tests/test_vehicles.py::TestCreateVehicle::test_rejects_invalid_payloads[overrides0] PASSED [ 71%]
tests/test_vehicles.py::TestCreateVehicle::test_rejects_invalid_payloads[overrides1] PASSED [ 72%]
tests/test_vehicles.py::TestCreateVehicle::test_rejects_invalid_payloads[overrides2] PASSED [ 73%]
tests/test_vehicles.py::TestCreateVehicle::test_rejects_invalid_payloads[overrides3] PASSED [ 74%]
tests/test_vehicles.py::TestCreateVehicle::test_rejects_invalid_payloads[overrides4] PASSED [ 75%]
tests/test_vehicles.py::TestCreateVehicle::test_rejects_invalid_payloads[overrides5] PASSED [ 76%]
tests/test_vehicles.py::TestCreateVehicle::test_rejects_invalid_payloads[overrides6] PASSED [ 77%]
tests/test_vehicles.py::TestCreateVehicle::test_rejects_invalid_payloads[overrides7] PASSED [ 78%]
tests/test_vehicles.py::TestCreateVehicle::test_rejects_missing_required_fields PASSED [ 79%]
tests/test_vehicles.py::TestListVehicles::test_empty_inventory_returns_empty_list PASSED [ 80%]
tests/test_vehicles.py::TestListVehicles::test_lists_all_vehicles_sorted_by_make_then_model PASSED [ 80%]
tests/test_vehicles.py::TestListVehicles::test_lists_sold_out_vehicles_too PASSED [ 81%]
tests/test_vehicles.py::TestListVehicles::test_requires_authentication PASSED [ 82%]
tests/test_vehicles.py::TestListVehicles::test_rejects_an_invalid_token PASSED [ 83%]
tests/unit/test_security.py::TestPasswordHashing::test_hash_is_not_the_plain_password PASSED [ 84%]
tests/unit/test_security.py::TestPasswordHashing::test_same_password_hashes_differently_each_time PASSED [ 85%]
tests/unit/test_security.py::TestPasswordHashing::test_verify_accepts_correct_password PASSED [ 86%]
tests/unit/test_security.py::TestPasswordHashing::test_verify_rejects_wrong_password PASSED [ 87%]
tests/unit/test_security.py::TestAccessTokens::test_token_round_trips_subject_and_role PASSED [ 88%]
tests/unit/test_security.py::TestAccessTokens::test_expired_token_is_rejected PASSED [ 89%]
tests/unit/test_security.py::TestAccessTokens::test_tampered_token_is_rejected PASSED [ 90%]
tests/unit/test_security.py::TestAccessTokens::test_garbage_token_is_rejected PASSED [ 91%]
tests/unit/test_security.py::test_verify_returns_false_for_password_over_bcrypt_limit PASSED [ 92%]
tests/unit/test_services.py::TestAuthServiceTokens::test_token_for_a_deleted_user_is_rejected PASSED [ 93%]
tests/unit/test_services.py::TestAuthServiceTokens::test_token_with_non_numeric_subject_is_rejected PASSED [ 94%]
tests/unit/test_services.py::TestVehicleServiceStock::test_purchase_reduces_stock PASSED [ 95%]
tests/unit/test_services.py::TestVehicleServiceStock::test_purchase_beyond_stock_raises_and_keeps_quantity PASSED [ 96%]
tests/unit/test_services.py::TestVehicleServiceStock::test_purchase_unknown_vehicle_raises_not_found PASSED [ 97%]
tests/unit/test_services.py::TestVehicleServiceStock::test_restock_of_vehicle_deleted_mid_request_raises_not_found PASSED [ 98%]
tests/unit/test_services.py::TestVehicleServiceSearch::test_passes_cleaned_criteria_to_repository PASSED [ 99%]
tests/unit/test_services.py::TestVehicleServiceSearch::test_equal_min_and_max_price_is_allowed PASSED [100%]

================================ tests coverage ================================
_______________ coverage: platform linux, python 3.13.17-final-0 _______________

Name                                     Stmts   Miss  Cover   Missing
----------------------------------------------------------------------
app/__init__.py                              0      0   100%
app/api/__init__.py                          0      0   100%
app/api/deps.py                             28      0   100%
app/api/errors.py                           10      0   100%
app/api/routes/__init__.py                   0      0   100%
app/api/routes/auth.py                      15      0   100%
app/api/routes/vehicles.py                  28      0   100%
app/core/__init__.py                         0      0   100%
app/core/config.py                          19      0   100%
app/core/security.py                        25      0   100%
app/db/__init__.py                           0      0   100%
app/db/base.py                               3      0   100%
app/db/session.py                           11      4    64%   16-20
app/main.py                                 14      0   100%
app/models/__init__.py                       3      0   100%
app/models/user.py                          19      0   100%
app/models/vehicle.py                       16      0   100%
app/repositories/__init__.py                 0      0   100%
app/repositories/user_repository.py         16      0   100%
app/repositories/vehicle_repository.py      50      0   100%
app/schemas/__init__.py                      0      0   100%
app/schemas/auth.py                         32      0   100%
app/schemas/vehicle.py                      52      0   100%
app/scripts/__init__.py                      0      0   100%
app/scripts/seed.py                         20      0   100%
app/services/__init__.py                     0      0   100%
app/services/auth_service.py                28      0   100%
app/services/exceptions.py                   9      0   100%
app/services/vehicle_service.py             34      0   100%
----------------------------------------------------------------------
TOTAL                                      432      4    99%
============================= 105 passed in 7.43s ==============================
```

</details>

## Frontend

```bash
cd frontend
npm run coverage   # vitest run --coverage
```

<details>
<summary>Full Vitest output (with coverage table)</summary>

```text
Coverage enabled with v8

 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – browsing > lists every vehicle from the API 229ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – browsing > summarises the inventory 49ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – browsing > shows an empty state when there is no stock 36ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – browsing > shows an error when the inventory fails to load 40ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – browsing > can hide sold-out vehicles 113ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – browsing > can sort by price 96ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – search > searches with the entered filters 318ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – search > offers every category from the inventory 73ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – search > validates the price range before calling the API 234ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – search > clearing the filters reloads the full inventory 241ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – purchasing > purchases a vehicle and updates its stock 77ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – purchasing > shows the error when a purchase fails 70ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – purchasing > does not let anyone buy a sold-out vehicle 36ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – admin tools > hides admin tools from regular users 47ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – admin tools > lets an admin add a vehicle 450ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – admin tools > keeps the add dialog open and shows API errors 234ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – admin tools > lets an admin edit a vehicle, sending only changed fields 195ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – admin tools > lets an admin delete a vehicle after confirming 143ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – admin tools > does nothing if the admin cancels the delete 120ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – admin tools > lets an admin restock a sold-out vehicle 175ms
 ✓ src/pages/DashboardPage.test.tsx > DashboardPage – admin tools > closes dialogs with Escape 129ms
 ✓ src/pages/auth.test.tsx > authentication flow > redirects anonymous visitors to the login page 157ms
 ✓ src/pages/auth.test.tsx > authentication flow > logs in and lands on the dashboard 332ms
 ✓ src/pages/auth.test.tsx > authentication flow > shows the server error when login fails 293ms
 ✓ src/pages/auth.test.tsx > authentication flow > refuses to register when passwords do not match 430ms
 ✓ src/pages/auth.test.tsx > authentication flow > refuses to register with a password shorter than 8 characters 315ms
 ✓ src/pages/auth.test.tsx > authentication flow > registers, signs in automatically and shows the dashboard 464ms
 ✓ src/pages/auth.test.tsx > authentication flow > remembers the signed-in user across reloads without extra API calls 230ms
 ✓ src/pages/auth.test.tsx > authentication flow > treats a stored token without a stored user as signed out 15ms
 ✓ src/pages/auth.test.tsx > authentication flow > logs out 59ms
 ✓ src/pages/auth.test.tsx > authentication flow > sends signed-in users away from the login page 21ms
 ✓ src/components/VehicleCard.test.tsx > VehicleCard > shows the vehicle details with an INR price 108ms
 ✓ src/components/VehicleCard.test.tsx > VehicleCard > calls onPurchase with the vehicle when Purchase is clicked 44ms
 ✓ src/components/VehicleCard.test.tsx > VehicleCard > disables Purchase when the vehicle is out of stock 15ms
 ✓ src/components/VehicleCard.test.tsx > VehicleCard > highlights low stock 8ms
 ✓ src/components/VehicleCard.test.tsx > VehicleCard > disables Purchase while a purchase is in flight 13ms
 ✓ src/components/VehicleCard.test.tsx > VehicleCard > hides admin controls from regular users 20ms
 ✓ src/components/VehicleCard.test.tsx > VehicleCard > gives admins edit, restock and delete controls 67ms
 ✓ src/pages/session.test.tsx > expired session > returns to the login page when the API rejects the saved token 276ms
 ✓ src/api/client.test.ts > apiRequest > returns parsed JSON on success 9ms
 ✓ src/api/client.test.ts > apiRequest > sends JSON bodies with the right content type 3ms
 ✓ src/api/client.test.ts > apiRequest > attaches the stored bearer token 1ms
 ✓ src/api/client.test.ts > apiRequest > omits Authorization when there is no token 1ms
 ✓ src/api/client.test.ts > apiRequest > appends query params, skipping empty values 1ms
 ✓ src/api/client.test.ts > apiRequest > returns undefined for 204 No Content 1ms
 ✓ src/api/client.test.ts > apiRequest > throws ApiError with the server detail message 1ms
 ✓ src/api/client.test.ts > apiRequest > summarises FastAPI validation errors 2ms
 ✓ src/api/client.test.ts > apiRequest > notifies listeners and clears the saved session on 401 1ms
 ✓ src/api/client.test.ts > apiRequest > reports network failures as a friendly ApiError 1ms
 ✓ src/api/client.test.ts > tokenStore user persistence > round-trips the signed-in user 0ms
 ✓ src/api/client.test.ts > tokenStore user persistence > returns null for corrupted stored data 0ms
 ✓ src/api/endpoints.test.ts > endpoint functions > register calls the right endpoint 5ms
 ✓ src/api/endpoints.test.ts > endpoint functions > login calls the right endpoint 1ms
 ✓ src/api/endpoints.test.ts > endpoint functions > list calls the right endpoint 0ms
 ✓ src/api/endpoints.test.ts > endpoint functions > search calls the right endpoint 0ms
 ✓ src/api/endpoints.test.ts > endpoint functions > create calls the right endpoint 0ms
 ✓ src/api/endpoints.test.ts > endpoint functions > update calls the right endpoint 0ms
 ✓ src/api/endpoints.test.ts > endpoint functions > remove calls the right endpoint 0ms
 ✓ src/api/endpoints.test.ts > endpoint functions > purchase calls the right endpoint 0ms
 ✓ src/api/endpoints.test.ts > endpoint functions > restock calls the right endpoint 0ms
 ✓ src/utils/format.test.ts > formatPrice > formats 649000 as ₹6,49,000 2ms
 ✓ src/utils/format.test.ts > formatPrice > formats 1449000 as ₹14,49,000 0ms
 ✓ src/utils/format.test.ts > formatPrice > formats 999.5 as ₹1,000 0ms
 ✓ src/utils/format.test.ts > vehicleName > joins make and model 0ms

 Test Files  7 passed (7)
      Tests  64 passed (64)
   Start at  18:49:48
   Duration  14.47s (transform 388ms, setup 1.04s, collect 1.05s, tests 6.02s, environment 3.37s, prepare 743ms)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   96.82 |    92.88 |      97 |   96.82 |                   
 src               |   73.33 |      100 |      80 |   73.33 |                   
  App.tsx          |   73.33 |      100 |      75 |   73.33 | 31-39             
  types.ts         |       0 |        0 |       0 |       0 |                   
 src/api           |   93.44 |    89.65 |     100 |   93.44 |                   
  auth.ts          |     100 |      100 |     100 |     100 |                   
  client.ts        |   92.15 |    87.75 |     100 |   92.15 | ...,60,68,141-143 
  vehicles.ts      |     100 |      100 |     100 |     100 |                   
 src/components    |   96.76 |    87.75 |     100 |   96.76 |                   
  AuthLayout.tsx   |     100 |      100 |     100 |     100 |                   
  ...leteModal.tsx |   90.62 |       50 |     100 |   90.62 | 24-26             
  ...toryStats.tsx |     100 |      100 |     100 |     100 |                   
  Logo.tsx         |     100 |      100 |     100 |     100 |                   
  Navbar.tsx       |     100 |      100 |     100 |     100 |                   
  RestockModal.tsx |   88.67 |       50 |     100 |   88.67 | 25-27,33-35       
  ...chFilters.tsx |     100 |    94.44 |     100 |     100 | 106               
  VehicleCard.tsx  |     100 |    95.23 |     100 |     100 | 32                
  ...FormModal.tsx |   94.64 |    86.48 |     100 |   94.64 | 65-67,69-71       
 src/components/ui |     100 |      100 |     100 |     100 |                   
  Alert.tsx        |     100 |      100 |     100 |     100 |                   
  Button.tsx       |     100 |      100 |     100 |     100 |                   
  Modal.tsx        |     100 |      100 |     100 |     100 |                   
  TextField.tsx    |     100 |      100 |     100 |     100 |                   
  Toast.tsx        |     100 |      100 |     100 |     100 |                   
 src/context       |     100 |    94.73 |     100 |     100 |                   
  AuthContext.tsx  |     100 |    94.73 |     100 |     100 | 63                
 src/hooks         |     100 |      100 |     100 |     100 |                   
  useInventory.ts  |     100 |      100 |     100 |     100 |                   
 src/pages         |   98.99 |    97.14 |   92.85 |   98.99 |                   
  ...boardPage.tsx |     100 |      100 |      90 |     100 |                   
  LoginPage.tsx    |     100 |      100 |     100 |     100 |                   
  RegisterPage.tsx |   96.15 |    85.71 |     100 |   96.15 | 41-43             
 src/utils         |   83.33 |       75 |     100 |   83.33 |                   
  errors.ts        |      60 |       50 |     100 |      60 | 6-7               
  format.ts        |     100 |      100 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
```

</details>
