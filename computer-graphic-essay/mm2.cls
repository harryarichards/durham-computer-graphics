\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{mm2}
\LoadClass[a4paper,11pt]{article}
\RequirePackage{amsmath}
\RequirePackage{relsize}
\RequirePackage{graphicx}
\RequirePackage{changebar}
\usepackage[headheight=14pt,vmargin=2.5cm,innermargin=2.5cm,outermargin=2.5cm,marginparsep=.5cm,marginparwidth=3.6cm]{geometry}
\usepackage[colorlinks=true, linkcolor=blue, urlcolor=blue,
  citecolor=blue, plainpages=false, pdfpagelabels]{hyperref}
\usepackage{fancyhdr}
\usepackage[usenames,dvipsnames]{color}

% Section headers and title.
\usepackage[compact]{titlesec}
\titlespacing{\section}{0pt}{*3}{*1.5}
\titlespacing{\subsection}{0pt}{*2.5}{*1.5}
\makeatletter
\renewcommand{\title}[1]{\def\mm@title{#1}}
\newcommand{\cisid}[1]{\def\mm@cisid{#1}}
\AtBeginDocument{\begin{center}\huge\mm@title\end{center}\vspace{1ex}}
\makeatother

% Page numbers
\pagestyle{fancy}
\fancyhf{} % clear all header and footer fields
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\fancyfoot[R]{{\smaller\thepage}}
\makeatletter
\fancyhead[R]{{\smaller \mm@cisid}}
\makeatother

% Margin notes and answer environment with rule in margin.

\setlength\changebarsep{1em}
\newcommand{\marginnote}[1]{\marginpar{~~\raggedright\smaller\smaller{#1}}}

\newenvironment{answer}[1]{%
  \cbstart
  \marginnote{{\bfseries Q#1}}
}{\cbend}


