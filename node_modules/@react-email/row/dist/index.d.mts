import * as React from 'react';

type RootProps = React.ComponentPropsWithoutRef<"table">;
interface RowProps extends RootProps {
    children: React.ReactNode;
}
declare const Row: React.ForwardRefExoticComponent<Readonly<RowProps> & React.RefAttributes<HTMLTableElement>>;

export { Row, RowProps };
