# Requirements Document

## Introduction

This feature enables users to import existing project data (TodoBooks with tasks and comments) from JSON files into the debug interface. The import functionality will handle data structure transformation, ID dependency resolution, and user ownership assignment, providing a seamless way to restore or transfer project data between environments.

## Requirements

### Requirement 1

**User Story:** As a developer/tester, I want to import project data from JSON files through the debug interface, so that I can restore backed-up projects or test with realistic data.

#### Acceptance Criteria

1. WHEN a user clicks the import button THEN the system SHALL trigger a file selection dialog
2. WHEN a user selects a JSON file THEN the system SHALL validate that it contains valid todobook export data
3. WHEN the file validation fails THEN the system SHALL display a clear error message indicating the validation failure
4. WHEN the file contains invalid JSON format THEN the system SHALL display a JSON parsing error message

### Requirement 2

**User Story:** As a developer, I want the import process to handle ID dependencies correctly, so that comment reply relationships and task associations are maintained.

#### Acceptance Criteria

1. WHEN importing tasks with comments THEN the system SHALL create new IDs for all entities while preserving relationships
2. WHEN a comment has a reply_to field THEN the system SHALL map it to the corresponding new comment ID
3. WHEN task creation fails THEN the system SHALL skip the associated comments and log the failure
4. WHEN comment creation fails THEN the system SHALL continue with other comments and log the specific failure

### Requirement 3

**User Story:** As a user, I want all imported data to be associated with my user account, so that I have proper ownership and access rights.

#### Acceptance Criteria

1. WHEN importing data THEN the system SHALL verify the user is logged in and authenticated
2. WHEN creating the TodoBook THEN the system SHALL set creator_id to the current user's ID
3. WHEN creating tasks THEN the system SHALL set both creator_id and assignee_id to the current user's ID
4. WHEN creating comments THEN the system SHALL set user_id to the current user's ID
5. WHEN the user is not authenticated THEN the system SHALL prevent import and display an authentication error

### Requirement 4

**User Story:** As a user, I want detailed feedback during the import process, so that I can understand what was imported successfully and what failed.

#### Acceptance Criteria

1. WHEN starting import THEN the system SHALL display progress information including file parsing status
2. WHEN creating entities THEN the system SHALL display real-time progress for TodoBooks, tasks, and comments
3. WHEN import completes THEN the system SHALL display completion status
4. WHEN any failures occur THEN the system SHALL display detailed error messages for debugging
5. WHEN displaying progress THEN the system SHALL show entity titles/content excerpts for easy identification

### Requirement 5

**User Story:** As a developer, I want the import to be transactionally safe, so that partial failures don't leave the system in an inconsistent state.

#### Acceptance Criteria

1. WHEN TodoBook creation fails THEN the system SHALL abort the entire import process
2. WHEN individual task creation fails THEN the system SHALL continue with remaining tasks but skip associated comments
3. WHEN comment creation fails THEN the system SHALL continue with remaining comments
4. WHEN import encounters critical errors THEN the system SHALL provide clear failure messages without corrupting existing data