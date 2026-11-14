# Pending GitHub owner actions

The integration can push code and create pull requests, but GitHub rejected `createRepository`, repository settings updates and organization settings updates with “Resource not accessible by integration.” These are GitHub permission limits, not a request for additional task authorization.

## Prepared changes

- Create empty **private** repositories `Aaruni-Tech/aarunitech-web` and `Aaruni-Tech/aarunicloud-platform`. Tested allowlisted exports are ready to push. Keep them private during staging.
- Apply `organization.json` to `orgs/Aaruni-Tech` using GitHub's organization settings or an owner-authorized API connection. It replaces the payroll-specific homepage with the corporate site.
- Apply `sdk-repository.json` to `repos/Aaruni-Tech/aarunicloud-sdk`. Actual package manifests already use these canonical names.
- Create a **public** `Aaruni-Tech/.github` organization profile repository if desired, then place `profile/README.md` there. This profile includes public product links only.
- Pin the corporate site, Cloud platform, SDK, and relevant open-source HR repositories after staging and release review. Do not expose the private Assistant repository or private production source merely to make a profile link work.

Do not archive the ecommerce repository, transfer repositories, change billing, or rewrite fork licenses. Ecommerce's ongoing business role has not been confirmed. Syllovo's production repository/hosting and each Cloud service's release status still require owner confirmation.

Repository creation and settings updates were not completed. Production domains, existing repository visibility and default branches were not changed.
