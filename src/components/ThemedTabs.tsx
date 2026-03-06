import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css'; // You can remove default styles if using Tailwind only

type ThemedTabsProps = {
    tabs: { title: string; content: React.ReactNode }[];
};

export default function ThemedTabs({ tabs }: ThemedTabsProps) {
    return (
        <Tabs>
            <TabList
                className="
          mb-4 flex items-center justify-center gap-2
          rounded-xl border border-[var(--muted)] bg-[var(--background)] p-1
          shadow-inner
        "
            >
                {tabs.map((tab, i) => (
                    <Tab
                        key={i}
                        className="
              flex-1 text-center cursor-pointer rounded-lg px-4 py-2 text-sm
              text-[var(--muted)] hover:bg-[var(--muted)]/10 hover:text-[var(--foreground)]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-[var(--accent)]/60 focus-visible:ring-offset-[var(--background)]
            "
                        selectedClassName="
              bg-[var(--foreground)]/5 text-[var(--foreground)] shadow
              ring-1 ring-[var(--accent)]/40
            "
                    >
                        {tab.title}
                    </Tab>
                ))}
            </TabList>

            {tabs.map((tab, i) => (
                <TabPanel key={i} className="" selectedClassName="block">
                    {tab.content}
                </TabPanel>
            ))}
        </Tabs>
    );
}
