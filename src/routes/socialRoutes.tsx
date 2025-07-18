import React from 'react';
import { RouteObject } from 'react-router-dom';
import { SocialPostDetail } from '../components/social/SocialPostDetail';

// Define routes for social media related pages
export const socialRoutes: RouteObject[] = [
  {
    path: '/social/posts/:id',
    element: <SocialPostDetail />
  }
];
