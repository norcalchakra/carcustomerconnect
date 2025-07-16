# Car Customer Connect Database Documentation

This document provides a comprehensive overview of the database schema for the Car Customer Connect application. Use this as a reference when developing features that interact with the Supabase backend.

## Tables Overview

The application uses the following tables:

1. **dealerships** - Stores information about dealerships
2. **vehicles** - Stores vehicle inventory information
3. **vehicle_events** - Tracks lifecycle events for vehicles
4. **vehicle_photos** - Stores photos associated with vehicles

## Table Schemas

### dealerships

Stores information about car dealerships.

| Column     | Type                     | Description                           | Constraints    |
|------------|--------------------------|---------------------------------------|----------------|
| id         | BIGSERIAL                | Primary key                           | PRIMARY KEY    |
| created_at | TIMESTAMP WITH TIME ZONE | Creation timestamp                    | DEFAULT NOW()  |
| name       | TEXT                     | Dealership name                       | NOT NULL       |
| address    | TEXT                     | Street address                        | NOT NULL       |
| city       | TEXT                     | City                                  | NOT NULL       |
| state      | TEXT                     | State/province                        | NOT NULL       |
| zip        | TEXT                     | Postal/zip code                       | NOT NULL       |
| phone      | TEXT                     | Contact phone number                  | NOT NULL       |
| website    | TEXT                     | Website URL                           |                |
| user_id    | UUID                     | Reference to auth.users               | NOT NULL, FK   |

### vehicles

Stores vehicle inventory information.

| Column        | Type                     | Description                           | Constraints                                     |
|---------------|--------------------------|---------------------------------------|------------------------------------------------|
| id            | BIGSERIAL                | Primary key                           | PRIMARY KEY                                     |
| created_at    | TIMESTAMP WITH TIME ZONE | Creation timestamp                    | DEFAULT NOW()                                   |
| updated_at    | TIMESTAMP WITH TIME ZONE | Last update timestamp                 | DEFAULT NOW()                                   |
| year          | INTEGER                  | Vehicle year                          | NOT NULL                                        |
| make          | TEXT                     | Vehicle manufacturer                  | NOT NULL                                        |
| model         | TEXT                     | Vehicle model                         | NOT NULL                                        |
| vin           | TEXT                     | Vehicle identification number         | NOT NULL                                        |
| stock_number  | TEXT                     | Dealership stock number               | NOT NULL                                        |
| price         | NUMERIC                  | Vehicle price                         | NOT NULL                                        |
| mileage       | INTEGER                  | Vehicle mileage                       | NOT NULL                                        |
| color         | TEXT                     | Vehicle color                         | NOT NULL                                        |
| status        | TEXT                     | Current status in lifecycle           | NOT NULL, CHECK (IN ('acquired', 'in_service', 'ready_for_sale', 'sold')) |
| description   | TEXT                     | Vehicle description                   |                                                |
| features      | TEXT[]                   | Array of vehicle features             |                                                |
| dealership_id | BIGINT                   | Reference to dealerships              | NOT NULL, FK                                    |

### vehicle_events

Tracks lifecycle events for vehicles.

| Column              | Type                     | Description                           | Constraints                                                 |
|---------------------|--------------------------|---------------------------------------|-------------------------------------------------------------|
| id                  | BIGSERIAL                | Primary key                           | PRIMARY KEY                                                 |
| created_at          | TIMESTAMP WITH TIME ZONE | Event timestamp                       | DEFAULT NOW()                                               |
| vehicle_id          | BIGINT                   | Reference to vehicles                 | NOT NULL, FK, ON DELETE CASCADE                             |
| event_type          | TEXT                     | Type of event                         | NOT NULL, CHECK (IN ('acquired', 'service_complete', 'ready_for_sale', 'sold')) |
| notes               | TEXT                     | Additional event notes                |                                                             |
| posted_to_facebook  | BOOLEAN                  | Whether posted to Facebook            | DEFAULT FALSE                                               |
| posted_to_instagram | BOOLEAN                  | Whether posted to Instagram           | DEFAULT FALSE                                               |
| posted_to_google    | BOOLEAN                  | Whether posted to Google Business     | DEFAULT FALSE                                               |
| post_id             | TEXT                     | ID of social media post if applicable |                                                             |

### vehicle_photos

Stores photos associated with vehicles.

| Column     | Type                     | Description                           | Constraints                     |
|------------|--------------------------|---------------------------------------|--------------------------------|
| id         | BIGSERIAL                | Primary key                           | PRIMARY KEY                     |
| created_at | TIMESTAMP WITH TIME ZONE | Creation timestamp                    | DEFAULT NOW()                   |
| vehicle_id | BIGINT                   | Reference to vehicles                 | NOT NULL, FK, ON DELETE CASCADE |
| url        | TEXT                     | URL to the photo                      | NOT NULL                        |
| order      | INTEGER                  | Display order                         | NOT NULL                        |

## Row Level Security (RLS) Policies

The database uses Row Level Security to ensure users can only access their own data:

### dealerships
- Users can only view, insert, and update dealerships they own (based on user_id)

### vehicles
- Users can only view, insert, update, and delete vehicles in dealerships they own

### vehicle_events
- Users can only view and insert events for vehicles in dealerships they own

### vehicle_photos
- Users can only view, insert, and delete photos for vehicles in dealerships they own

## Sample Data

The database is initialized with:

1. A sample dealership (ABC Motors)
2. Three sample vehicles (Toyota Camry, Honda Civic, Ford F-150)
3. Several vehicle events for each vehicle
4. Sample photos for each vehicle

## Event Types

The following event types are supported:

1. **acquired** - Vehicle was acquired by the dealership
2. **service_complete** - Service or maintenance was completed
3. **ready_for_sale** - Vehicle is ready to be sold
4. **sold** - Vehicle has been sold

## Vehicle Statuses

The following vehicle statuses are supported:

1. **acquired** - Vehicle was recently acquired
2. **in_service** - Vehicle is being serviced
3. **ready_for_sale** - Vehicle is on the lot and ready for sale
4. **sold** - Vehicle has been sold

## API Usage Examples

### Fetching Vehicles
```typescript
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('dealership_id', dealershipId)
  .order('created_at', { ascending: false });
```

### Creating a Vehicle Event
```typescript
const { data, error } = await supabase
  .from('vehicle_events')
  .insert({
    vehicle_id: vehicleId,
    event_type: 'service_complete',
    notes: 'Oil change and tire rotation'
  })
  .select();
```

### Updating Vehicle Status
```typescript
const { data, error } = await supabase
  .from('vehicles')
  .update({ status: 'ready_for_sale' })
  .eq('id', vehicleId)
  .select();
```
