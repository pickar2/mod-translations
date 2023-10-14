import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "~/components/ui/select";
import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";

import React, { useEffect } from "react";
import { verifyZoneOnFileDrop, DropZone } from "~/components/DropZone";
import { Header } from "~/components/Header";
import { TranslationTable } from "~/components/TranslationTable";
import { TranslationContextInit } from "~/contexts/TranslationContext";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import NoSsr from "~/components/NoSsr";

const Home: NextPage = () => {
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });

  // if (localStorage.theme === "dark" ||
  //   (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  // ) {
  //   document.documentElement.classList.add("dark");
  // } else {
  //   document.documentElement.classList.remove("dark");
  // }

  // useEffect(() => {
  //   document.documentElement.classList.add("dark");
  // }, []);

  return (
    <>
      <Head>
        <title>Mod translations</title>
        <meta name="description" content="Mod translations" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <TranslationContextInit>
        <main
          className="relative flex min-h-screen flex-col items-center justify-center bg-slate-900"
          onDragStart={verifyZoneOnFileDrop}
          onDragOver={verifyZoneOnFileDrop}
          onDrop={verifyZoneOnFileDrop}
        >
          <NoSsr>
            <Header />
          </NoSsr>
          <div className="container mt-8 flex flex-col items-center justify-center gap-12 px-4 py-16">
            <DropZone />
            <TranslationTable />
            {/* <div className="flex flex-col items-center gap-2">
              <p className="text-2xl text-white">{hello.data ? hello.data.greeting : "Loading tRPC query..."}</p>
              <AuthShowcase />
            </div> */}
          </div>
          <div className="flex min-h-full flex-grow-[2] flex-col items-end justify-end p-1">
            <a href="https://github.com/pickar2/mod-translations">Source code</a>
          </div>
        </main>
      </TranslationContextInit>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
