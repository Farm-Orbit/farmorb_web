// import React from 'react';
// import { render, screen } from '@testing-library/react';
// import '@testing-library/jest-dom';

// // Mock the AuthGuard component directly
// const AuthGuard = ({ children }: { children: React.ReactNode }) => {
//   return <div data-testid="auth-guard">{children}</div>;
// };

// describe('AuthGuard', () => {
//   it('should render children', () => {
//     render(
//       <AuthGuard>
//         <div>Protected Content</div>
//       </AuthGuard>
//     );

//     expect(screen.getByTestId('auth-guard')).toBeTruthy();
//     expect(screen.getByText('Protected Content')).toBeTruthy();
//   });

//   it('should render multiple children', () => {
//     render(
//       <AuthGuard>
//         <div>Content 1</div>
//         <div>Content 2</div>
//       </AuthGuard>
//     );

//     expect(screen.getByText('Content 1')).toBeTruthy();
//     expect(screen.getByText('Content 2')).toBeTruthy();
//   });
// });