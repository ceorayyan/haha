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

interface DataContextType {
  reviews: Review[];
  articles: Article[];
  user: User;
  getReviewById: (id: number) => Review | undefined;
  getArticlesByReviewId: (reviewId: number) => Article[];
  getArticleById: (id: number) => Article | undefined;
  updateArticle: (id: number, updates: Partial<Article>) => void;
  createReview: (review: Omit<Review, "id" | "articles" | "members" | "stats">) => void;
  deleteReview: (id: number) => void;
  updateReview: (id: number, updates: Partial<Review>) => void;
  addMemberToReview: (reviewId: number, member: Omit<Member, "id">) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
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
  }, [mounted]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!mounted || reviews.length === 0) return;
    localStorage.setItem("reviews", JSON.stringify(reviews));
  }, [reviews, mounted]);

  useEffect(() => {
    if (!mounted || articles.length === 0) return;
    localStorage.setItem("articles", JSON.stringify(articles));
  }, [articles, mounted]);

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

  return (
    <DataContext.Provider
      value={{
        reviews,
        articles,
        user,
        getReviewById,
        getArticlesByReviewId,
        getArticleById,
        updateArticle,
        createReview,
        deleteReview,
        updateReview,
        addMemberToReview,
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
