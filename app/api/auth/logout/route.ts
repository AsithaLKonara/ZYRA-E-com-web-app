import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withErrorHandler } from '@/lib/cors';
import { PrismaClient } from '@prisma/client';

// Create Prisma client
const prisma = new PrismaClient();

// Logout user
const POSTHandler = async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      logger.warn('Logout attempt without active session');
      monitoring.recordCounter('auth.logout.no_session', 1);
      
      return NextResponse.json(
        { message: 'No active session found' },
        { status: 200 }
      );
    }

    logger.info('User logout request', {
      userId: session.user.id,
      email: session.user.email,
    });

    // Record metric
    monitoring.recordCounter('auth.logout.requests', 1, {
      userId: session.user.id,
    });

    // Update user's last logout time
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        updatedAt: new Date(),
      },
    });

    // Record success metric
    monitoring.recordCounter('auth.logout.success', 1);
    monitoring.recordTimer('auth.logout.duration', Date.now() - startTime);

    logger.info('User logged out successfully', {
      userId: session.user.id,
      email: session.user.email,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Logout failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('auth.logout.error', 1);

    throw error;
  }
};

// Apply error handling and API versioning decorators
export const POST = withApiVersioning(withErrorHandler(POSTHandler));


