/** Booking module operations (venues + events). */

import { EVENT_FIELDS, PAGE_INFO_FIELDS, VENUE_FIELDS } from './fields';

export const VENUE_OPS = {
  get: `query Venue($id: ID!) { venue(id: $id) { ${VENUE_FIELDS} } }`,
  list: `query Venues($includeInactive: Boolean) {
    venues(includeInactive: $includeInactive) { ${VENUE_FIELDS} }
  }`,
  create: `mutation CreateVenue($input: CreateVenueInput!) {
    createVenue(input: $input) { changedEntities venue { ${VENUE_FIELDS} } }
  }`,
  update: `mutation UpdateVenue($input: UpdateVenueInput!) {
    updateVenue(input: $input) { changedEntities venue { ${VENUE_FIELDS} } }
  }`,
};

export const EVENT_OPS = {
  get: `query Event($id: ID!) { event(id: $id) { ${EVENT_FIELDS} } }`,
  list: `query Events($first: Int, $after: String, $search: String, $filter: EventFilterInput, $sort: EventSortInput) {
    events(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges { node { ${EVENT_FIELDS} } cursor }
      pageInfo { ${PAGE_INFO_FIELDS} }
    }
  }`,
  mySchedule: `query MySchedule($date: String) { mySchedule(date: $date) { ${EVENT_FIELDS} } }`,
  checkConflicts: `query CheckEventConflicts($input: CreateEventInput!) {
    checkEventConflicts(input: $input) { kind message conflictingEventIds }
  }`,
  create: `mutation CreateEvent($input: CreateEventInput!) { createEvent(input: $input) { changedEntities event { ${EVENT_FIELDS} } } }`,
  update: `mutation UpdateEvent($input: UpdateEventInput!) { updateEvent(input: $input) { changedEntities event { ${EVENT_FIELDS} } } }`,
  cancel: `mutation CancelEvent($id: ID!, $reason: String) { cancelEvent(id: $id, reason: $reason) { changedEntities event { ${EVENT_FIELDS} } } }`,
};
