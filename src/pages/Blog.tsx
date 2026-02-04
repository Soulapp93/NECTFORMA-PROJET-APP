import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Calendar, ArrowRight, Tag, Folder } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublishedPosts, getCategories, BlogPost, BlogCategory } from '@/services/blogService';
import logoNf from '@/assets/logo-nf.png';

const BlogHeader = () => (
  <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <img src={logoNf} alt="Nectforma" className="h-8" />
        <span className="font-semibold text-lg">Nectforma</span>
      </Link>
      <nav className="hidden md:flex items-center gap-6">
        <Link to="/blog" className="text-sm font-medium hover:text-primary transition-colors">
          Blog
        </Link>
        <Link to="/solutions" className="text-sm font-medium hover:text-primary transition-colors">
          Solutions
        </Link>
        <Link to="/fonctionnalites" className="text-sm font-medium hover:text-primary transition-colors">
          Fonctionnalités
        </Link>
      </nav>
      <Link to="/auth">
        <Button variant="default" size="sm">
          Se connecter
        </Button>
      </Link>
    </div>
  </header>
);

const BlogFooter = () => (
  <footer className="border-t bg-muted/30 py-12 mt-16">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src={logoNf} alt="Nectforma" className="h-8" />
            <span className="font-semibold">Nectforma</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            La plateforme de gestion pour les établissements d'enseignement supérieur.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Produit</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</Link></li>
            <li><Link to="/solutions" className="hover:text-foreground transition-colors">Solutions</Link></li>
            <li><Link to="/pourquoi-nous" className="hover:text-foreground transition-colors">Pourquoi nous</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Ressources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
            <li><Link to="/documentation" className="hover:text-foreground transition-colors">Documentation</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Légal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link></li>
            <li><Link to="/politique-confidentialite" className="hover:text-foreground transition-colors">Politique de confidentialité</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Nectforma. Tous droits réservés.
      </div>
    </div>
  </footer>
);

const PostCard = ({ post }: { post: BlogPost }) => (
  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
    {post.cover_image_url && (
      <div className="aspect-video overflow-hidden">
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
    )}
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-3">
        {post.category && (
          <Badge variant="secondary" className="text-xs" style={{ backgroundColor: post.category.color + '20', color: post.category.color }}>
            {post.category.name}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {post.read_time_minutes} min
        </span>
      </div>
      
      <Link to={`/blog/${post.slug}`}>
        <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h2>
      </Link>
      
      {post.excerpt && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        {post.published_at && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(post.published_at), 'd MMMM yyyy', { locale: fr })}
          </span>
        )}
        <Link 
          to={`/blog/${post.slug}`}
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          Lire <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </CardContent>
  </Card>
);

const PostCardSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-video" />
    <CardContent className="p-6 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardContent>
  </Card>
);

const Blog = () => {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsData, categoriesData] = await Promise.all([
        getPublishedPosts(20, 0),
        getCategories()
      ]);
      
      // Filter by category if selected
      const filteredPosts = selectedCategory
        ? postsData.filter(p => p.category?.slug === selectedCategory)
        : postsData;
      
      setPosts(filteredPosts);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredPost = posts[0];
  const otherPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Blog Nectforma
            </h1>
            <p className="text-lg text-muted-foreground">
              Découvrez nos articles sur la gestion des formations, l'innovation pédagogique et les bonnes pratiques pour les établissements d'enseignement.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={!selectedCategory ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Tous
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.slug ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className="whitespace-nowrap"
                >
                  <Folder className="h-3 w-3 mr-1" />
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Articles */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Aucun article</h2>
              <p className="text-muted-foreground">
                {selectedCategory 
                  ? "Aucun article dans cette catégorie pour le moment."
                  : "Le blog est en cours de préparation. Revenez bientôt !"}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && !selectedCategory && (
                <div className="mb-12">
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 md:flex">
                    {featuredPost.cover_image_url && (
                      <div className="md:w-1/2 aspect-video md:aspect-auto overflow-hidden">
                        <img
                          src={featuredPost.cover_image_url}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <CardContent className="p-8 md:w-1/2 flex flex-col justify-center">
                      <Badge className="w-fit mb-4">À la une</Badge>
                      <Link to={`/blog/${featuredPost.slug}`}>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                          {featuredPost.title}
                        </h2>
                      </Link>
                      {featuredPost.excerpt && (
                        <p className="text-muted-foreground mb-6 line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {featuredPost.read_time_minutes} min de lecture
                        </span>
                        {featuredPost.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(featuredPost.published_at), 'd MMMM yyyy', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Grid of Posts */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(selectedCategory ? posts : otherPosts).map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Prêt à transformer votre gestion ?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Découvrez comment Nectforma peut simplifier la gestion de votre établissement.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">Commencer gratuitement</Button>
            </Link>
            <Link to="/fonctionnalites">
              <Button size="lg" variant="outline">Voir les fonctionnalités</Button>
            </Link>
          </div>
        </div>
      </section>

      <BlogFooter />
    </div>
  );
};

export default Blog;
