
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MessageCircle, Heart, Share } from 'lucide-react';

export function CommunitySection() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 font-space mb-2">Community</h2>
          <p className="text-gray-600">Connect with fellow students and share knowledge</p>
        </div>
        <Button className="bg-gray-800 hover:bg-gray-700">
          <MessageCircle className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((post) => (
            <Card key={post} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      J
                    </div>
                    <div>
                      <h3 className="font-semibold">John Doe</h3>
                      <p className="text-sm text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Biology</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">Need help with cellular respiration!</h4>
                <p className="text-gray-700 mb-4">
                  Can someone explain the difference between aerobic and anaerobic respiration? 
                  I'm having trouble understanding the electron transport chain...
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                    <Heart className="w-4 h-4" />
                    12
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    5 replies
                  </button>
                  <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                    <Share className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Active Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Biology Study Group</p>
                    <p className="text-sm text-gray-500">234 members</p>
                  </div>
                  <Button size="sm" variant="outline">Join</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chemistry Help</p>
                    <p className="text-sm text-gray-500">156 members</p>
                  </div>
                  <Button size="sm" variant="outline">Join</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Physics Problem Solving</p>
                    <p className="text-sm text-gray-500">89 members</p>
                  </div>
                  <Button size="sm" variant="outline">Join</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trending Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="secondary" className="mr-2">#CellularRespiration</Badge>
                <Badge variant="secondary" className="mr-2">#OrganicChemistry</Badge>
                <Badge variant="secondary" className="mr-2">#Calculus</Badge>
                <Badge variant="secondary" className="mr-2">#StudyTips</Badge>
                <Badge variant="secondary" className="mr-2">#ExamPrep</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Posts</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Helpful answers</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Reputation</span>
                  <span className="font-semibold">156</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
