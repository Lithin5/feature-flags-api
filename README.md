<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Feature Flags API

A NestJS-based API for managing feature flags with authentication and role-based access control.

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Server Configuration
PORT=5001

# CORS Configuration
# Comma-separated list of allowed origins (frontend domains)
CORS_ORIGINS=http://localhost:5000,http://localhost:3000,https://your-frontend-domain.com

# Cookie Configuration (for production)
# Set this to your frontend domain (not backend domain)
COOKIE_DOMAIN=your-frontend-domain.com

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
JWT_EXPIRES_IN=1h

# Database Configuration
DATABASE_URL=your-database-url
```

### CORS Origins

The `CORS_ORIGINS` environment variable accepts a comma-separated list of allowed origins. For example:
- Single origin: `CORS_ORIGINS=http://localhost:5000`
- Multiple origins: `CORS_ORIGINS=http://localhost:5000,http://localhost:3000,https://your-frontend-domain.com`

If not specified, it defaults to `http://localhost:5000`.

### Cookie Domain Configuration

For production deployments, you need to set the `COOKIE_DOMAIN` environment variable to your frontend domain. This is crucial for authentication to work properly.

**Important Notes:**
- Set `COOKIE_DOMAIN` to your **frontend domain**, not your backend domain
- Remove any protocol (http:// or https://) and paths from the domain
- Examples:
  - ✅ `COOKIE_DOMAIN=your-frontend-domain.com`
  - ✅ `COOKIE_DOMAIN=.your-frontend-domain.com`
  - ❌ `COOKIE_DOMAIN=https://your-frontend-domain.com`
  - ❌ `COOKIE_DOMAIN=your-backend-domain.com`

**Troubleshooting Cookie Domain Issues:**

If you encounter the error "This attempt to set cookie via a set-cookie header was blocked because its domain attribute was invalid with regards to the current host url", try these solutions:

1. **Check your COOKIE_DOMAIN setting:**
   ```bash
   # Correct format
   COOKIE_DOMAIN=your-frontend-domain.com
   
   # If you have subdomains, you might need:
   COOKIE_DOMAIN=.your-frontend-domain.com
   ```

2. **Verify domain matches exactly:**
   - If your frontend is at `https://app.example.com`, set `COOKIE_DOMAIN=app.example.com`
   - If your frontend is at `https://example.com`, set `COOKIE_DOMAIN=example.com`

3. **For subdomain scenarios:**
   - If your frontend is at `https://app.example.com` and you want cookies to work across all subdomains, set `COOKIE_DOMAIN=.example.com`
   - If you only want cookies for the exact subdomain, set `COOKIE_DOMAIN=app.example.com`

4. **Vercel and Public Suffix Domains:**
   If you're deploying on Vercel, Netlify, or similar platforms, **do not set** the `COOKIE_DOMAIN` environment variable. These platforms use public suffix domains (like `vercel.app`, `netlify.app`) which browsers block for security reasons.
   
   - ✅ **Correct for Vercel**: Don't set `COOKIE_DOMAIN` at all
   - ❌ **Incorrect for Vercel**: `COOKIE_DOMAIN=.feature-flags-ui-sigma.vercel.app`
   
   The application will automatically detect public suffix domains and skip setting the domain attribute.

5. **Temporary workaround:**
   If you're still having issues, you can temporarily remove the `COOKIE_DOMAIN` environment variable to use default cookie behavior (cookies will only work for the exact domain that sets them).

6. **Check browser console:**
   Look for console logs that show the processed domain and any validation warnings.

**Example Production Configuration:**
```bash
# For a frontend at https://myapp.com
COOKIE_DOMAIN=myapp.com

# For a frontend at https://app.mycompany.com with subdomain support
COOKIE_DOMAIN=.mycompany.com

# For Vercel/Netlify deployments (don't set COOKIE_DOMAIN)
# COOKIE_DOMAIN not set

# For local development (no domain needed)
# COOKIE_DOMAIN not set
```

### Production Deployment Checklist

1. **Set NODE_ENV**: Ensure `NODE_ENV=production` is set in your environment
2. **Configure CORS**: Set `CORS_ORIGINS` to include your frontend domain(s)
3. **Configure Cookie Domain**: Set `COOKIE_DOMAIN` to your frontend domain
4. **Secure Headers**: Ensure your production environment supports secure cookies
5. **Database**: Configure your production database connection

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
