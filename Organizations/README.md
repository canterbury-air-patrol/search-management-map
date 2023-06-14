---
sort: 3
---
# Organizations

Organizations are a way to to group users and assets. If an organization is added to a mission, then all members of that organization will have access to that mission. Also, organizations provide a way for users to act for assets that belong to other users.

How you break down organizations will depend on who has access to your instance. You should start with a single organization if your instance is just used by a single organization or team. Make sure to add all users to the organization.

## Interface
The organizations interface is at `/organization/` i.e. [http://localhost:8080/organization/](http://localhost:8080/organization/)

## Adding a New Organization
From the Organizations page, you can add a new Organization at the bottom of the page. Organizations names must be unique across the entire instance.

## Managing an Organization
From the Organizations page, Click the "Details" button next to the organization you wish to manage.
On this page you will see the details of the organization including all the current members (users and assets).

## Add Users to an Organization
You can add a user by selecting the desired user from the drop-down box under the list of users and clicking the `Add` button to the right.

## Changing a Users Organization Role
The [Organizational Role](Roles) of each member can be changed by selecting a new role from the drop-down box by their name and clicking `Save`. Note: You cannot change your own Role.

## Remove a User
Members with the `Admin` role can remove a user by click the `Delete` button next to their name. Note: You cannot remove yourself.

## Add an Asset
The user who is the owner of an asset will be able to add them to the organization if they are also an `Admin` of the organization.

## Remove an Asset
Members with the `Admin` role can remove a user by click the `Delete` button next to their name.