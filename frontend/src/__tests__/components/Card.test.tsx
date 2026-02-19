import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardBody, CardFooter } from '../../shared/components/Card';

describe('Card Components', () => {
  it('renders Card with children', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders CardHeader with content', () => {
    render(
      <Card>
        <CardHeader>Header content</CardHeader>
      </Card>
    );
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('renders CardBody with content', () => {
    render(
      <Card>
        <CardBody>Body content</CardBody>
      </Card>
    );
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders CardFooter with content', () => {
    render(
      <Card>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders all parts together', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <div>Content</div>
      </Card>
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('is hoverable when isHoverable is true', () => {
    const { container } = render(
      <Card isHoverable>
        <div>Content</div>
      </Card>
    );
    expect(container.firstChild).toHaveClass('hover:shadow-md');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <Card onClick={handleClick}>
        <div>Content</div>
      </Card>
    );
    
    screen.getByText('Content').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
