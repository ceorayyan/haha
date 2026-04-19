"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import mockData from "../data/mockData.json";

// Types
export interface Review {
  id: number;
  title: string;
  dateCreated: string;
  owner: string;
  type: string;
  domain: string;
  description: string;
  articles: number;
  members: Member[];
  stats: ReviewStats;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
}

export interface ReviewStats {
  importedReferences: number;
  totalDuplicates: number;
  unresolved: number;
  resolved: number;
  notDuplicate: number;
  deleted: number;
}

export interface Article {
  id: number;
  reviewId: number;
  title: string;
  authors: string;
  year: number;
  journal: string;
  keywords: string[];
  abstract: string;
  fullText: string;
  status: "included" | "excluded" | "undecided";
  screeningDecision: "include" | "exclude" | "maybe" | null;
  screeningNotes: string;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  preferences: {
    theme: string;
  };
}

export interface ScreeningCriteria {
  id: number;
  reviewId: number;
  type: 'inclusion' | 'exclusion';
  criteria: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}

export interface BlindModeState {
  enabled: boolean;
  hiddenFields: string[];
}

export interface ScreeningSummary {
  reviewId: number;
  totalArticles: number;
  screened: number;
  unscreened: number;
  conflicts: number;
  confirmations: number;
  progressPercentage: number;
  teamProgress: TeamMemberProgress[];
}

export interface TeamMemberProgress {
  memberId: number;
  memberName: string;
  screened: number;
  conflicts: number;
  confirmations: number;
}

interface DataContextType {
  reviews: Review[];
  articles: Article[];
  user: User;
  screeningCriteria: ScreeningCriteria[];
  blindMode: BlindModeState;
  getReviewById: (id: number) => Review | undefined;
  getArticlesByReviewId: (reviewId: number) => Article[];
  getArticleById: (id: number) => Article | undefined;
  updateArticle: (id: number, updates: Partial<Article>) => void;
  createReview: (review: Omit<Review, "id" | "articles" | "members" | "stats">) => void;
  deleteReview: (id: number) => void;
  updateReview: (id: number, updates: Partial<Review>) => void;
  addMemberToReview: (reviewId: number, member: Omit<Member, "id">) => void;
  addScreeningCriteria: (reviewId: number, type: 'inclusion' | 'exclusion', criteria: string, createdBy: string, description?: string) => void;
  deleteScreeningCriteria: (id: number) => void;
  updateScreeningCriteria: (id: number, updates: Partial<ScreeningCriteria>) => void;
  getReviewCriteria: (reviewId: number) => ScreeningCriteria[];
  toggleBlindMode: () => void;
  getScreeningSummary: (reviewId: number) => ScreeningSummary;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [screeningCriteria, setScreeningCriteria] = useState<ScreeningCriteria[]>([]);
  const [blindMode, setBlindMode] = useState<BlindModeState>({ enabled: false, hiddenFields: [] });
  const [user] = useState<User>(mockData.user);

  // Load data from localStorage or use mock data
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Load data from localStorage or use mock data
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!mounted) return;

    const savedReviews = localStorage.getItem("reviews");
    const savedArticles = localStorage.getItem("articles");
    const savedScreeningCriteria = localStorage.getItem("screeningCriteria");
    const savedBlindMode = localStorage.getItem("blindMode");

    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    } else {
      setReviews(mockData.reviews as Review[]);
    }

    if (savedArticles) {
      setArticles(JSON.parse(savedArticles));
    } else {
      setArticles(mockData.articles as Article[]);
    }

    if (savedScreeningCriteria) {
      setScreeningCriteria(JSON.parse(savedScreeningCriteria));
    } else {
      setScreeningCriteria(mockData.screeningCriteria as ScreeningCriteria[] || []);
    }

    if (savedBlindMode) {
      setBlindMode(JSON.parse(savedBlindMode));
    } else {
      setBlindMode({ enabled: false, hiddenFields: ['reviewer_name', 'reviewer_avatar', 'reviewer_email'] });
    }
  }, [mounted]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("reviews", JSON.stringify(reviews));
  }, [reviews, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("articles", JSON.stringify(articles));
  }, [articles, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("screeningCriteria", JSON.stringify(screeningCriteria));
  }, [screeningCriteria, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("blindMode", JSON.stringify(blindMode));
  }, [blindMode, mounted]);

  const getReviewById = (id: number) => {
    return reviews.find((r) => r.id === id);
  };

  const getArticlesByReviewId = (reviewId: number) => {
    return articles.filter((a) => a.reviewId === reviewId);
  };

  const getArticleById = (id: number) => {
    return articles.find((a) => a.id === id);
  };

  const updateArticle = (id: number, updates: Partial<Article>) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id ? { ...article, ...updates } : article
      )
    );
  };

  const createReview = (review: Omit<Review, "id" | "articles" | "members" | "stats">) => {
    const newReview: Review = {
      ...review,
      id: Math.max(...reviews.map((r) => r.id), 0) + 1,
      articles: 0,
      members: [
        {
          id: 1,
          name: user.name,
          email: user.email,
          role: "Owner",
          status: "Active",
          avatar: user.avatar,
        },
      ],
      stats: {
        importedReferences: 0,
        totalDuplicates: 0,
        unresolved: 0,
        resolved: 0,
        notDuplicate: 0,
        deleted: 0,
      },
    };
    setReviews((prev) => [...prev, newReview]);
  };

  const deleteReview = (id: number) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setArticles((prev) => prev.filter((a) => a.reviewId !== id));
  };

  const updateReview = (id: number, updates: Partial<Review>) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === id ? { ...review, ...updates } : review
      )
    );
  };

  const addMemberToReview = (reviewId: number, member: Omit<Member, "id">) => {
    setReviews((prev) =>
      prev.map((review) => {
        if (review.id === reviewId) {
          const newMember: Member = {
            ...member,
            id: Math.max(...review.members.map((m) => m.id), 0) + 1,
          };
          return {
            ...review,
            members: [...review.members, newMember],
          };
        }
        return review;
      })
    );
  };

  const addScreeningCriteria = (
    reviewId: number,
    type: 'inclusion' | 'exclusion',
    criteria: string,
    createdBy: string,
    description?: string
  ) => {
    const newCriteria: ScreeningCriteria = {
      id: Math.max(...screeningCriteria.map((c) => c.id), 0) + 1,
      reviewId,
      type,
      criteria,
      description,
      createdAt: new Date().toISOString(),
      createdBy,
    };
    setScreeningCriteria((prev) => [...prev, newCriteria]);
  };

  const deleteScreeningCriteria = (id: number) => {
    setScreeningCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const updateScreeningCriteria = (id: number, updates: Partial<ScreeningCriteria>) => {
    setScreeningCriteria((prev) =>
      prev.map((criteria) =>
        criteria.id === id ? { ...criteria, ...updates } : criteria
      )
    );
  };

  const getReviewCriteria = (reviewId: number) => {
    return screeningCriteria.filter((c) => c.reviewId === reviewId);
  };

  const toggleBlindMode = () => {
    setBlindMode((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const getScreeningSummary = (reviewId: number): ScreeningSummary => {
    const reviewArticles = getArticlesByReviewId(reviewId);
    const screened = reviewArticles.filter((a) => a.screeningDecision !== null).length;
    const unscreened = reviewArticles.length - screened;
    const progressPercentage = reviewArticles.length > 0 ? (screened / reviewArticles.length) * 100 : 0;

    // Calculate team progress
    const review = getReviewById(reviewId);
    const teamProgress: TeamMemberProgress[] = review?.members.map((member) => ({
      memberId: member.id,
      memberName: member.name,
      screened: 0,
      conflicts: 0,
      confirmations: 0,
    })) || [];

    return {
      reviewId,
      totalArticles: reviewArticles.length,
      screened,
      unscreened,
      conflicts: 0,
      confirmations: 0,
      progressPercentage,
      teamProgress,
    };
  };

  return (
    <DataContext.Provider
      value={{
        reviews,
        articles,
        user,
        screeningCriteria,
        blindMode,
        getReviewById,
        getArticlesByReviewId,
        getArticleById,
        updateArticle,
        createReview,
        deleteReview,
        updateReview,
        addMemberToReview,
        addScreeningCriteria,
        deleteScreeningCriteria,
        updateScreeningCriteria,
        getReviewCriteria,
        toggleBlindMode,
        getScreeningSummary,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
