// AUTO placeholder registry to avoid import errors
export type WidgetEntry = {
  slug: string;
  name: string;
  Component?: (props: any) => JSX.Element;
};

export const widgetModules: WidgetEntry[] = [
  {
    slug: 'sample-counter',
    name: 'Sample Counter',
    Component: function SampleCounter() {
      return <div className="text-sm opacity-70">Counter widget placeholder</div>;
    }
  }
];
