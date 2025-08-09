import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Role } from './roles.enum';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenGuard } from './refresh-token.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: Role;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService, 
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  private extractDomain(urlOrDomain: string): string {
    if (!urlOrDomain || !urlOrDomain.trim()) return '';
    
    let domain = urlOrDomain.trim();
    
    // Remove protocol (http:// or https://) if present
    domain = domain.replace(/^https?:\/\//, '');
    
    // Remove path and query parameters if present
    domain = domain.split('/')[0];
    
    return domain;
  }

  private validateDomain(domain: string): boolean {
    if (!domain || !domain.trim()) return false;
    
    const extractedDomain = this.extractDomain(domain);
    console.log('Validating domain:', extractedDomain);
    
    // Don't allow localhost or IP addresses
    if (extractedDomain === 'localhost') {
      console.log('Rejected: localhost');
      return false;
    }
    if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(extractedDomain)) {
      console.log('Rejected: IP address');
      return false;
    }
    
    // Must contain a dot
    if (!extractedDomain.includes('.')) {
      console.log('Rejected: no dot found');
      return false;
    }
    
    // Check for valid domain format - must be alphanumeric with hyphens and dots
    const domainRegex = /^\.?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(extractedDomain)) {
      console.log('Rejected: invalid domain format');
      return false;
    }
    
    // Don't allow domains with consecutive dots or ending with dot
    if (extractedDomain.includes('..') || extractedDomain.endsWith('.')) {
      console.log('Rejected: consecutive dots or ends with dot');
      return false;
    }
    
    console.log('Domain validation passed:', extractedDomain);
    return true;
  }

  private getCookieOptions(): any {
    const options: any = {
      httpOnly: true,
      secure: this.configService.get('cookie.secure'),
      sameSite: this.configService.get('cookie.sameSite'),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Add domain in production if specified
    const cookieDomain = this.configService.get('cookie.domain');
    if (process.env.NODE_ENV === 'production' && cookieDomain) {
      try {
        // Extract clean domain from URL or domain string
        const extractedDomain = this.extractDomain(cookieDomain);
        console.log('Processing COOKIE_DOMAIN:', cookieDomain);
        console.log('Extracted domain:', extractedDomain);
        
        if (extractedDomain && extractedDomain.includes('.')) {
          // Check if this is a public suffix domain (like vercel.app, netlify.app, etc.)
          if (this.isPublicSuffixDomain(extractedDomain)) {
            console.log('Detected public suffix domain:', extractedDomain);
            console.log('For Vercel/Netlify domains, we need to set the domain to the frontend domain');
            // For public suffix domains like Vercel, we need to set the domain to allow cross-domain cookies
            // The domain should be the frontend domain (not the backend domain)
            options.domain = extractedDomain;
            console.log('Set cookie domain to:', extractedDomain);
          } else if (this.validateDomain(extractedDomain)) {
            // Ensure domain is properly formatted for cookies
            let formattedDomain = extractedDomain;
            
            // Only add leading dot if it doesn't already have one and isn't a www domain
            if (!formattedDomain.startsWith('.') && !formattedDomain.startsWith('www.')) {
              // Check if this is a valid domain that should have a leading dot
              // Don't add leading dot for IP addresses or localhost-like domains
              if (!formattedDomain.match(/^\d+\.\d+\.\d+\.\d+$/) && formattedDomain !== 'localhost') {
                formattedDomain = `.${formattedDomain}`;
              }
            }
            
            console.log('Formatted domain for cookie:', formattedDomain);
            
            // Additional safety check - only set domain if it's a valid domain
            if (this.isValidCookieDomain(formattedDomain)) {
              options.domain = formattedDomain;
            } else {
              console.warn('Domain failed final validation:', formattedDomain);
              console.warn('Skipping domain attribute - using default cookie behavior');
            }
          } else {
            console.warn('Domain validation failed for:', extractedDomain);
            console.warn('Skipping domain attribute - using default cookie behavior');
          }
        } else {
          console.warn('Invalid domain format:', cookieDomain);
          console.warn('Domain must contain at least one dot (.)');
          console.warn('Skipping domain attribute - using default cookie behavior');
        }
      } catch (error) {
        console.warn('Error processing COOKIE_DOMAIN:', error);
        console.warn('Skipping domain attribute - using default cookie behavior');
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.log('COOKIE_DOMAIN not set in production - using default cookie behavior');
        // In production without domain, ensure we have the right sameSite setting
        // for cross-origin requests
        if (!options.domain) {
          options.sameSite = 'none';
        }
      } else {
        console.log('Not in production mode - using default cookie behavior');
      }
    }

    console.log('Final cookie options:', options);
    return options;
  }

  private isValidCookieDomain(domain: string): boolean {
    // Additional validation for cookie domains
    if (!domain || typeof domain !== 'string') return false;
    
    // Must be a valid domain format
    const domainRegex = /^\.?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) return false;
    
    // Don't allow consecutive dots, dots at the end, or single dots
    if (domain.includes('..') || domain.endsWith('.') || domain === '.') return false;
    
    // Must contain at least one dot (for subdomains or main domains)
    if (!domain.includes('.')) return false;
    
    return true;
  }

  private isPublicSuffixDomain(domain: string): boolean {
    // Common public suffix domains that browsers block for cookies
    const publicSuffixes = [
      'vercel.app',
      'netlify.app',
      'herokuapp.com',
      'railway.app',
      'render.com',
      'fly.dev',
      'appspot.com',
      'firebaseapp.com',
      'github.io',
      'gitlab.io',
      'surge.sh',
      'now.sh',
      'co',
      'app',
      'dev',
    ];

    const lowerDomain = domain.toLowerCase();
    
    // Check if the domain ends with any public suffix
    return publicSuffixes.some(suffix => {
      // Check for exact match or subdomain
      return lowerDomain === suffix || lowerDomain.endsWith(`.${suffix}`);
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.userId);
  }


  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    const tokens = await this.authService.login(user);

    res.cookie('refresh_token', tokens.refresh_token, this.getCookieOptions());

    // Return user data along with access token
    const { password, hashedRt, ...userData } = user;
    return res.json({ 
      access_token: tokens.access_token,
      user: userData
    });
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refreshTokens(@Req() req, @Res() res: Response) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.authService
      .refreshTokens(userId, refreshToken)
      .then((tokens) => {
        res.cookie('refresh_token', tokens.refresh_token, this.getCookieOptions());
        return res.json({ access_token: tokens.access_token });
      });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(200).json({ message: 'Already logged out' });
      }

      // Decode refresh token to get user ID
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const userId = payload.sub;

      // Clear refresh token in DB
      await this.authService.logout(userId);

      // Clear refresh token cookie with same options as setting
      const clearCookieOptions = { ...this.getCookieOptions() };
      delete clearCookieOptions.maxAge; // Remove maxAge for clearing
      res.clearCookie('refresh_token', clearCookieOptions);

      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error('Logout error:', err);
      return res.status(200).json({ message: 'Already logged out' });
    }
  }
}
