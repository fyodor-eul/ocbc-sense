import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  Ellipsis,
  House,
  Landmark,
  LifeBuoy,
  Lock,
  LogOut,
  Receipt,
  Send,
  Settings,
  Wallet,
} from "lucide-react";

import Screen from "../components/Screen";
import Header from "../components/Header";
import Card from "../components/Card";
import Button from "../components/Button";
import AskSenseButton from "../components/AskSenseButton";
import Guidance from "../components/Guidance";
import PageReadAloud from "../components/PageReadAloud";

import { useJourney } from "../context/JourneyContext";
import { useHelp } from "../context/HelpContext";
import useT from "../i18n/useT";

import "./Home.css";
import "../components/StepScreen.css";

// Demo only: the quick actions and tabs look like a real app but do nothing yet.
const QUICK_ACTIONS = [
  { key: "accounts", icon: Wallet, label: "home.accounts" },
  { key: "transfer", icon: Send, label: "home.transfer" },
  { key: "cards", icon: CreditCard, label: "home.cards" },
  { key: "more", icon: Ellipsis, label: "home.more" },
];

const TABS = [
  { key: "home", icon: House, label: "hm.tab.home", active: true },
  { key: "accounts", icon: Wallet, label: "home.accounts" },
  { key: "transfer", icon: Send, label: "home.transfer" },
  { key: "cards", icon: CreditCard, label: "home.cards" },
  { key: "more", icon: Ellipsis, label: "home.more" },
];

// Where the application is today: submitted, now being reviewed, account not ready yet.
const TRACK = [
  { key: "submitted", label: "hm.track.submitted", state: "done" },
  { key: "review", label: "hm.track.review", state: "current" },
  { key: "ready", label: "hm.track.ready", state: "next" },
];

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "hm.greet.morning";
  if (hour < 18) return "hm.greet.afternoon";
  return "hm.greet.evening";
}

export default function Home() {
  const navigate = useNavigate();
  const { t, tw } = useT();

  const { reference, reset } = useJourney();
  const { openHelp } = useHelp();

  const [copied, setCopied] = useState("");
  const [greeting] = useState(greetingKey);

  if (!reference) {
    return <Navigate to="/welcome" replace />;
  }

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied("ok");

      window.setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch {
      setCopied("failed");
    }
  }

  function logOut() {
    reset();
    navigate("/welcome");
  }

  const stateText = {
    done: t("hm.track.done"),
    current: t("hm.track.current"),
    next: t("hm.track.next"),
  };

  return (
    <Screen
      header={<Header onSettings={() => navigate("/settings")} />}
      footer={
        <>
          <AskSenseButton onClick={openHelp} />
        </>
      }
    >
      <div className="home">
        {/* Greeting */}
        <section className="home__welcome">
          <h1 className="home__hello">{t(greeting)}</h1>
          <p className="home__intro">{t("hm.sub")}</p>
        </section>

        <PageReadAloud
          text={[
            t(greeting),
            t("hm.sub"),
            t("home.applicationProgress"),
            tw("home.status"),
          ]
            .filter(Boolean)
            .join(". ")}
        />

        <Guidance tone="status" message={tw("home.guidance.status")} />

        {/* Application status */}
        <section aria-labelledby="application-status">
          <Card className="home-hero">
            <div className="home-hero__top">
              <span className="home-hero__badge">
                <span className="home-hero__pulse" aria-hidden="true" />
                {t("home.pill")}
              </span>

              <span className="home-hero__icon" aria-hidden="true">
                <Landmark size={22} />
              </span>
            </div>

            <div className="home-hero__content">
              <p className="home-hero__label">{t("home.application")}</p>

              <h2 id="application-status" className="home-hero__title">
                {t("home.applicationProgress")}
              </h2>

              <p className="home-hero__text">{tw("home.status")}</p>
            </div>

            <ol className="home-track" aria-label={t("hm.track.aria")}>
              {TRACK.map(({ key, label, state }) => (
                <li key={key} className={`home-track__step is-${state}`}>
                  <span className="home-track__node" aria-hidden="true">
                    {state === "done" && <Check size={16} strokeWidth={3} />}
                    {state === "current" && (
                      <span className="home-track__dot" />
                    )}
                  </span>

                  <span className="home-track__label">{t(label)}</span>
                  <span className="sr-only">{stateText[state]}</span>
                </li>
              ))}
            </ol>

            <div className="home-hero__reference">
              <div>
                <p className="home-hero__ref-label">{t("common.refLabel")}</p>
                <p className="home-hero__ref">{reference}</p>
              </div>

              <button
                type="button"
                className="home-hero__copy"
                onClick={copyReference}
                aria-label={t("common.copyRef")}
              >
                <Copy size={18} aria-hidden="true" />
              </button>
            </div>

            {copied === "ok" && (
              <p className="home-hero__feedback" role="status">
                {t("common.copied")}
              </p>
            )}

            {copied === "failed" && (
              <p className="home-hero__feedback" role="status">
                {t("common.copyFailed")}
              </p>
            )}

            <Button variant="secondary" onClick={() => navigate("/next")}>
              {t("home.see")}
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </Card>
        </section>

        {/* Quick actions */}
        <section className="home__section" aria-labelledby="quick-actions">
          <h2 id="quick-actions" className="home__heading">
            {t("home.quickActions")}
          </h2>

          <div className="home-actions">
            {QUICK_ACTIONS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                className="home-action"
                aria-disabled="true"
              >
                <span className="home-action__icon" aria-hidden="true">
                  <Icon size={22} />
                  <span className="home-action__lock">
                    <Lock size={10} />
                  </span>
                </span>

                <span className="home-action__label">{t(label)}</span>
                <span className="sr-only">{t("hm.locked.sr")}</span>
              </button>
            ))}
          </div>

          <p className="home__caption">{t("hm.actions.locked")}</p>
        </section>

        {/* Accounts */}
        <section className="home__section" aria-labelledby="your-accounts">
          <div>
            <p className="home__eyebrow">{t("home.banking")}</p>
            <h2 id="your-accounts" className="home__heading">
              {t("home.yourAccounts")}
            </h2>
          </div>

          <div
            className="home-accounts"
            role="group"
            aria-labelledby="your-accounts"
            tabIndex={0}
          >
            <article className="acct acct--sgd">
              <div className="acct__top">
                <span className="acct__badge" aria-hidden="true">
                  S$
                </span>
                <span className="acct__chip">{t("home.pending")}</span>
              </div>

              <div>
                <h3 className="acct__name">{t("home.acct1")}</h3>
                <p className="acct__currency">{t("home.sgd")}</p>
              </div>

              <div>
                <p className="acct__label">{t("hm.balance")}</p>
                <p className="acct__balance">
                  <span aria-hidden="true">S$ —</span>
                  <span className="sr-only">{t("hm.balance.na")}</span>
                </p>
              </div>

              <p className="acct__note">{t("hm.acct.opens")}</p>
            </article>

            <article className="acct acct--usd">
              <div className="acct__top">
                <span className="acct__badge" aria-hidden="true">
                  US$
                </span>
                <span className="acct__chip">{t("home.pending")}</span>
              </div>

              <div>
                <h3 className="acct__name">{t("home.acct2")}</h3>
                <p className="acct__currency">{t("home.usd")}</p>
              </div>

              <div>
                <p className="acct__label">{t("hm.balance")}</p>
                <p className="acct__balance">
                  <span aria-hidden="true">US$ —</span>
                  <span className="sr-only">{t("hm.balance.na")}</span>
                </p>
              </div>

              <p className="acct__note">{t("hm.acct.opens")}</p>
            </article>
          </div>

          <p className="home__caption">{t("home.caption")}</p>
        </section>

        {/* First deposit */}
        <section className="home__section" aria-labelledby="first-deposit">
          <Card className="home-deposit">
            <div className="home-deposit__head">
              <span className="home-deposit__icon" aria-hidden="true">
                <Banknote size={22} />
              </span>

              <div className="home-deposit__title-wrap">
                <h2 id="first-deposit" className="home-deposit__title">
                  {t("hm.dep.title")}
                </h2>
                <span className="home-deposit__tag">{t("hm.dep.tag")}</span>
              </div>
            </div>

            <dl className="home-facts">
              <div className="home-fact">
                <dt>{t("hm.dep.amount")}</dt>
                <dd>{t("hm.dep.amount.v")}</dd>
              </div>

              <div className="home-fact">
                <dt>{t("hm.dep.how")}</dt>
                <dd>{t("hm.dep.how.v")}</dd>
              </div>

              <div className="home-fact">
                <dt>{t("hm.dep.when")}</dt>
                <dd>{t("hm.dep.when.v")}</dd>
              </div>
            </dl>
          </Card>
        </section>

        {/* Recent activity */}
        <section className="home__section" aria-labelledby="recent-activity">
          <h2 id="recent-activity" className="home__heading">
            {t("hm.activity.title")}
          </h2>

          <Card className="home-empty">
            <span className="home-empty__icon" aria-hidden="true">
              <Receipt size={24} />
            </span>

            <p className="home-empty__title">{t("hm.activity.empty")}</p>
            <p className="home-empty__text">{t("hm.activity.text")}</p>
          </Card>
        </section>

        {/* Help */}
        <section aria-labelledby="home-help">
          <Card className="home-help">
            <span className="home-help__icon" aria-hidden="true">
              <LifeBuoy size={22} />
            </span>

            <div className="home-help__body">
              <h2 id="home-help" className="home-help__title">
                {t("hm.help.title")}
              </h2>
              <p className="home-help__text">{t("hm.help.text")}</p>
            </div>

            <Button variant="outline" fullWidth={false} onClick={openHelp}>
              {t("hm.help.cta")}
            </Button>
          </Card>
        </section>

        {/* Settings and support */}
        <section className="home__section" aria-labelledby="home-more">
          <h2 id="home-more" className="home__heading">
            {t("hm.more.title")}
          </h2>

          <Card className="home-list">
            <button
              type="button"
              className="home-list__row"
              onClick={() => navigate("/settings")}
            >
              <span className="home-list__icon" aria-hidden="true">
                <Settings size={20} />
              </span>
              <span className="home-list__label">{t("common.settings")}</span>
              <ChevronRight size={20} aria-hidden="true" />
            </button>

            <button type="button" className="home-list__row" onClick={openHelp}>
              <span className="home-list__icon" aria-hidden="true">
                <LifeBuoy size={20} />
              </span>
              <span className="home-list__label">{t("hm.more.help")}</span>
              <ChevronRight size={20} aria-hidden="true" />
            </button>

            <button type="button" className="home-list__row" onClick={logOut}>
              <span className="home-list__icon" aria-hidden="true">
                <LogOut size={20} />
              </span>
              <span className="home-list__label">{t("home.logout")}</span>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </Card>
        </section>
      </div>
    </Screen>
  );
}
